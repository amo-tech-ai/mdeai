import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Notification {
  id: string;
  type: string;
  title: string;
  description?: string;
  tripId?: string;
  actionUrl?: string;
  priority: number;
  status: "pending" | "shown" | "dismissed" | "acted";
  createdAt: Date;
  shownAt?: Date;
  respondedAt?: Date;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("proactive_suggestions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "shown"])
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description || undefined,
        tripId: item.trip_id || undefined,
        actionUrl: item.action_url || undefined,
        priority: item.priority || 5,
        status: item.status as Notification["status"],
        createdAt: new Date(item.created_at),
        shownAt: item.shown_at ? new Date(item.shown_at) : undefined,
        respondedAt: item.responded_at ? new Date(item.responded_at) : undefined,
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  // Mark notification as shown
  const markAsShown = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("proactive_suggestions")
        .update({
          status: "shown",
          shown_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Dismiss notification
  const dismiss = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("proactive_suggestions")
        .update({
          status: "dismissed",
          responded_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark as acted (user clicked the action)
  const markAsActed = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("proactive_suggestions")
        .update({
          status: "acted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Computed values
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === "pending").length,
    [notifications]
  );

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      today: [],
      yesterday: [],
      older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const notification of notifications) {
      const createdDate = new Date(
        notification.createdAt.getFullYear(),
        notification.createdAt.getMonth(),
        notification.createdAt.getDate()
      );

      if (createdDate >= today) {
        groups.today.push(notification);
      } else if (createdDate >= yesterday) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    }

    return groups;
  }, [notifications]);

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    groupedNotifications,
    markAsShown: markAsShown.mutate,
    dismiss: dismiss.mutate,
    markAsActed: markAsActed.mutate,
  };
}
