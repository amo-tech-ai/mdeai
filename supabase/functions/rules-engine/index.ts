import { getCorsHeaders, jsonResponse, errorBody } from "../_shared/http.ts";
import { getServiceClient } from "../_shared/supabase-clients.ts";

interface RuleResult {
  userId: string;
  type: string;
  title: string;
  description: string;
  tripId?: string;
  actionUrl?: string;
  priority?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  // Auth: RULES_ENGINE_SECRET header (service-to-service, called by pg_cron)
  const secret = Deno.env.get("RULES_ENGINE_SECRET");
  if (secret) {
    const incoming = req.headers.get("x-rules-engine-secret");
    if (incoming !== secret) {
      return jsonResponse(errorBody("UNAUTHORIZED", "Invalid or missing rules engine secret"), 401, req);
    }
  }

  try {
    const supabase = getServiceClient();
    const suggestions: RuleResult[] = [];
    const now = new Date();

    // ============================================
    // RULE 1: Empty Day Detection
    // ============================================
    const { data: trips, error: tripsError } = await supabase
      .from("trips")
      .select(`
        id,
        title,
        user_id,
        start_date,
        end_date,
        trip_items (
          id,
          start_at
        )
      `)
      .eq("status", "active")
      .is("deleted_at", null)
      .gte("end_date", now.toISOString().split("T")[0]);

    if (tripsError) {
      console.error("Error fetching trips:", tripsError);
    } else if (trips) {
      for (const trip of trips) {
        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const daysWithItems = new Set<number>();
        for (const item of trip.trip_items || []) {
          if (item.start_at) {
            const itemDate = new Date(item.start_at);
            const dayIndex = Math.floor((itemDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex < totalDays) {
              daysWithItems.add(dayIndex);
            }
          }
        }

        const emptyDays: number[] = [];
        for (let i = 0; i < totalDays; i++) {
          if (!daysWithItems.has(i)) emptyDays.push(i + 1);
        }

        if (emptyDays.length > 0 && emptyDays.length < totalDays) {
          const dayText = emptyDays.length === 1
            ? `Day ${emptyDays[0]}`
            : `Days ${emptyDays.slice(0, 3).join(", ")}${emptyDays.length > 3 ? ` and ${emptyDays.length - 3} more` : ""}`;
          suggestions.push({
            userId: trip.user_id,
            type: "empty_day",
            title: `Empty day in ${trip.title}`,
            description: `${dayText} ${emptyDays.length === 1 ? "has" : "have"} no activities planned. Add some experiences!`,
            tripId: trip.id,
            actionUrl: `/trips/${trip.id}`,
            priority: 7,
          });
        }
      }
    }

    // ============================================
    // RULE 2: Budget Threshold Alert
    // ============================================
    const { data: budgets, error: budgetsError } = await supabase
      .from("budget_tracking")
      .select(`
        id,
        trip_id,
        total_budget,
        total_spent,
        alert_threshold,
        trips!inner (
          id,
          title,
          user_id,
          status
        )
      `)
      .eq("trips.status", "active");

    if (budgetsError) {
      console.error("Error fetching budgets:", budgetsError);
    } else if (budgets) {
      for (const budget of budgets) {
        const tripData = budget.trips as unknown as { id: string; title: string; user_id: string; status: string } | null;
        if (!tripData || !budget.total_budget) continue;

        const spent = budget.total_spent || 0;
        const threshold = budget.alert_threshold || 0.8;
        const percentUsed = spent / budget.total_budget;

        if (percentUsed >= threshold && percentUsed < 1) {
          suggestions.push({
            userId: tripData.user_id,
            type: "budget_warning",
            title: `Budget alert for ${tripData.title}`,
            description: `You've spent ${Math.round(percentUsed * 100)}% of your budget. Consider reviewing your expenses.`,
            tripId: budget.trip_id,
            actionUrl: `/trips/${budget.trip_id}`,
            priority: 8,
          });
        } else if (percentUsed >= 1) {
          suggestions.push({
            userId: tripData.user_id,
            type: "budget_exceeded",
            title: `Budget exceeded for ${tripData.title}`,
            description: `You've exceeded your budget by ${Math.round((percentUsed - 1) * 100)}%. Time to adjust your plans!`,
            tripId: budget.trip_id,
            actionUrl: `/trips/${budget.trip_id}`,
            priority: 9,
          });
        }
      }
    }

    // ============================================
    // RULE 3: Upcoming Event Reminder
    // ============================================
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const { data: upcomingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, user_id, resource_title, booking_type, start_date, start_time, trip_id")
      .eq("status", "confirmed")
      .gte("start_date", now.toISOString().split("T")[0])
      .lte("start_date", dayAfter.toISOString().split("T")[0]);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
    } else if (upcomingBookings) {
      for (const booking of upcomingBookings) {
        const bookingDate = new Date(booking.start_date);
        const isToday = bookingDate.toDateString() === now.toDateString();
        const isTomorrow = bookingDate.toDateString() === tomorrow.toDateString();
        if (isToday || isTomorrow) {
          suggestions.push({
            userId: booking.user_id,
            type: "booking_reminder",
            title: `${isTomorrow ? "Tomorrow" : "Today"}: ${booking.resource_title}`,
            description: `Your ${booking.booking_type} booking is ${isTomorrow ? "tomorrow" : "today"}${booking.start_time ? ` at ${booking.start_time}` : ""}.`,
            tripId: booking.trip_id || undefined,
            actionUrl: `/bookings`,
            priority: isToday ? 10 : 6,
          });
        }
      }
    }

    // ============================================
    // RULE 4: Trip Starting Soon
    // ============================================
    const threeDaysOut = new Date(now);
    threeDaysOut.setDate(threeDaysOut.getDate() + 3);

    const { data: upcomingTrips, error: upcomingTripsError } = await supabase
      .from("trips")
      .select("id, title, user_id, start_date")
      .eq("status", "active")
      .is("deleted_at", null)
      .gte("start_date", now.toISOString().split("T")[0])
      .lte("start_date", threeDaysOut.toISOString().split("T")[0]);

    if (upcomingTripsError) {
      console.error("Error fetching upcoming trips:", upcomingTripsError);
    } else if (upcomingTrips) {
      for (const trip of upcomingTrips) {
        const tripDate = new Date(trip.start_date);
        const daysUntil = Math.ceil((tripDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= 3) {
          const timeText = daysUntil === 0 ? "starts today" : daysUntil === 1 ? "starts tomorrow" : `starts in ${daysUntil} days`;
          suggestions.push({
            userId: trip.user_id,
            type: "trip_starting",
            title: `${trip.title} ${timeText}!`,
            description: `Get ready for your adventure. Review your itinerary and make sure everything is set.`,
            tripId: trip.id,
            actionUrl: `/trips/${trip.id}`,
            priority: daysUntil === 0 ? 10 : 8,
          });
        }
      }
    }

    // ============================================
    // Insert suggestions (dedup by type+trip+user in last 24h)
    // ============================================
    let inserted = 0;
    let skipped = 0;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const suggestion of suggestions) {
      const { data: existing } = await supabase
        .from("proactive_suggestions")
        .select("id")
        .eq("user_id", suggestion.userId)
        .eq("type", suggestion.type)
        .eq("trip_id", suggestion.tripId || null)
        .gte("created_at", yesterday.toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const { error: insertError } = await supabase
        .from("proactive_suggestions")
        .insert({
          user_id: suggestion.userId,
          type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          trip_id: suggestion.tripId || null,
          action_url: suggestion.actionUrl || null,
          priority: suggestion.priority || 5,
          agent_name: "rules-engine",
          status: "pending",
        });

      if (insertError) {
        console.error("Error inserting suggestion:", insertError);
      } else {
        inserted++;
      }
    }

    console.log(`Rules engine completed: ${inserted} inserted, ${skipped} skipped`);

    return jsonResponse({ success: true, processed: suggestions.length, inserted, skipped, timestamp: now.toISOString() }, 200, req);
  } catch (error) {
    console.error("Rules engine error:", error);
    return jsonResponse(errorBody("INTERNAL", error instanceof Error ? error.message : "Unknown error"), 500, req);
  }
});
