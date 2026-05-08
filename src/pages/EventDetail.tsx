import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BackToChatBar } from "@/components/chat/BackToChatBar";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Clock,
  Ticket,
  ExternalLink,
  Globe,
  Phone,
  Mail,
  Star,
} from "lucide-react";
import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEvent } from "@/hooks/useEvents";
import { useIsSaved, useToggleSave } from "@/hooks/useSavedPlaces";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import eventPlaceholder from "@/assets/event-1.jpg";
import { EventBookingWizardPremium } from "@/components/bookings/EventBookingWizardPremium";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = useEvent(id);
  const { user } = useAuth();
  const { data: isSaved = false } = useIsSaved(id || "", "event");
  const toggleSave = useToggleSave();
  const [showBookingWizard, setShowBookingWizard] = useState(false);

  const handleSave = () => {
    if (event && user) {
      toggleSave.mutate({
        locationId: event.id,
        locationType: "event",
        isSaved,
      });
    }
  };

  const handleGetTickets = () => {
    if (!user) return;
    setShowBookingWizard(true);
  };

  const getEventTypeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      concert: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      festival: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      sports: "bg-green-500/10 text-green-600 dark:text-green-400",
      tech: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      social: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      culture: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      food: "bg-red-500/10 text-red-600 dark:text-red-400",
      nightlife: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    };
    return colors[type || ""] || "bg-muted text-muted-foreground";
  };

  const formatPrice = () => {
    if (!event) return "Free";
    if (!event.ticket_price_min && !event.ticket_price_max) {
      return "Free";
    }
    const currency = event.currency || "COP";
    const min = event.ticket_price_min?.toLocaleString() || "0";
    const max = event.ticket_price_max?.toLocaleString();

    if (max && event.ticket_price_max !== event.ticket_price_min) {
      return `${currency} $${min} - $${max}`;
    }
    return `${currency} $${min}`;
  };

  const isFree = event && !event.ticket_price_min && !event.ticket_price_max;

  const rightPanelContent = event ? (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSave}
            disabled={toggleSave.isPending}
          >
            <Heart
              className={cn("w-4 h-4 mr-2", isSaved && "fill-red-500 text-red-500")}
            />
            {isSaved ? "Saved" : "Save Event"}
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Share2 className="w-4 h-4 mr-2" />
            Share Event
          </Button>
          <Button className="w-full" onClick={handleGetTickets}>
            <Ticket className="w-4 h-4 mr-2" />
            Get Tickets
          </Button>
        </CardContent>
      </Card>

      {/* Event Info Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">
              {format(new Date(event.event_start_time), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Time</p>
            <p className="font-medium">
              {format(new Date(event.event_start_time), "h:mm a")}
              {event.event_end_time &&
                ` - ${format(new Date(event.event_end_time), "h:mm a")}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="font-medium">{formatPrice()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Venue Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Venue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{event.address || event.city}</p>
          {event.latitude && event.longitude && (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View on Map
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  ) : null;

  if (isLoading) {
    return (
      <ThreePanelLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </ThreePanelLayout>
    );
  }

  if (error || !event) {
    return (
      <ThreePanelLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Event not found</h2>
          <p className="text-muted-foreground mt-2">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="mt-4">
            <Link to="/events">Back to Events</Link>
          </Button>
        </div>
      </ThreePanelLayout>
    );
  }

  return (
    <ThreePanelLayout>
      <div>
        <BackToChatBar />
      <div className="space-y-6 p-6">
        {/* Back Link */}
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        {/* Hero Image */}
        <div className="relative aspect-[21/9] rounded-xl overflow-hidden">
          <img
            src={event.primary_image_url || eventPlaceholder}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          {isFree && (
            <Badge className="absolute top-4 left-4 bg-green-500 text-white">
              Free Event
            </Badge>
          )}
        </div>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={getEventTypeColor(event.event_type)}
                >
                  {event.event_type || "Event"}
                </Badge>
                {event.is_verified && (
                  <Badge variant="outline" className="text-green-600">
                    Verified
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-display font-bold">{event.name}</h1>
            </div>

            {event.rating && (
              <div className="flex items-center gap-1 bg-yellow-500/10 px-3 py-2 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-lg">{event.rating.toFixed(1)}</span>
                {event.rating_count && (
                  <span className="text-sm text-muted-foreground ml-1">
                    ({event.rating_count})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Date, Time, Location */}
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{format(new Date(event.event_start_time), "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>
                {format(new Date(event.event_start_time), "h:mm a")}
                {event.event_end_time &&
                  ` - ${format(new Date(event.event_end_time), "h:mm a")}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{event.address || event.city}</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <span className="text-xl font-semibold">{formatPrice()}</span>
          </div>
        </div>

        <Separator />

        {/* Description */}
        {event.description && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">About This Event</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Contact & Links */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Contact & Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {event.website && (
              <Button variant="outline" className="justify-start" asChild>
                <a
                  href={event.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Visit Website
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              </Button>
            )}
            {event.phone && (
              <Button variant="outline" className="justify-start" asChild>
                <a href={`tel:${event.phone}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  {event.phone}
                </a>
              </Button>
            )}
            {event.email && (
              <Button variant="outline" className="justify-start" asChild>
                <a href={`mailto:${event.email}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  {event.email}
                </a>
              </Button>
            )}
            {event.ticket_url && (
              <Button className="justify-start" asChild>
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  External Tickets
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              </Button>
            )}
            <Button className="justify-start" onClick={handleGetTickets}>
              <Ticket className="w-4 h-4 mr-2" />
              Book Tickets
            </Button>
          </div>
        </div>

        {/* Booking Wizard Dialog */}
        <Dialog open={showBookingWizard} onOpenChange={setShowBookingWizard}>
          <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
            <EventBookingWizardPremium 
              event={{
                id: event.id,
                name: event.name,
                event_start_time: event.event_start_time,
                event_end_time: event.event_end_time || undefined,
                address: event.address || undefined,
                venue_name: event.address || undefined,
                ticket_price_min: event.ticket_price_min || undefined,
                ticket_price_max: event.ticket_price_max || undefined,
                primary_image_url: event.primary_image_url || undefined,
                category: event.event_type || undefined,
              }}
              onComplete={() => setShowBookingWizard(false)}
              onCancel={() => setShowBookingWizard(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </ThreePanelLayout>
  );
}
