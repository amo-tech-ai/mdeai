import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Bell, Calendar, DollarSign, MapPin, X, ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreePanelLayout } from "@/components/explore/ThreePanelLayout";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Bell> = {
  empty_day: Calendar,
  budget_warning: DollarSign,
  budget_exceeded: DollarSign,
  booking_reminder: Calendar,
  trip_starting: MapPin,
};

const typeColors: Record<string, string> = {
  empty_day: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  budget_warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  budget_exceeded: "bg-red-500/10 text-red-600 border-red-500/20",
  booking_reminder: "bg-green-500/10 text-green-600 border-green-500/20",
  trip_starting: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

function NotificationItem({ 
  notification, 
  onDismiss, 
  onAction 
}: { 
  notification: Notification;
  onDismiss: (id: string) => void;
  onAction: (notification: Notification) => void;
}) {
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || "bg-muted text-muted-foreground";

  return (
    <div className={cn(
      "flex items-start gap-4 p-4 rounded-xl transition-colors",
      notification.status === "pending" 
        ? "bg-card border border-border shadow-sm" 
        : "bg-muted/30"
    )}>
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-foreground">{notification.title}</h3>
            {notification.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {notification.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-1">
              {format(notification.createdAt, "MMM d, h:mm a")}
            </p>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {notification.actionUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction(notification)}
                className="h-8"
              >
                View
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDismiss(notification.id)}
              className="h-8 w-8 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {notification.status === "pending" && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </div>
  );
}

function NotificationGroup({ 
  title, 
  notifications, 
  onDismiss, 
  onAction 
}: { 
  title: string;
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onAction: (notification: Notification) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground px-1">{title}</h2>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

function NotificationsContent() {
  const navigate = useNavigate();
  const { 
    notifications, 
    isLoading, 
    unreadCount, 
    groupedNotifications,
    dismiss,
    markAsActed,
  } = useNotifications();

  const handleAction = (notification: Notification) => {
    markAsActed(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` 
                : "You're all caught up!"}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Badge className="bg-primary text-primary-foreground">
            {unreadCount} new
          </Badge>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No notifications</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            When you have trip reminders, booking updates, or AI suggestions, they'll appear here.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-6 pr-4">
            <NotificationGroup
              title="Today"
              notifications={groupedNotifications.today}
              onDismiss={dismiss}
              onAction={handleAction}
            />
            <NotificationGroup
              title="Yesterday"
              notifications={groupedNotifications.yesterday}
              onDismiss={dismiss}
              onAction={handleAction}
            />
            <NotificationGroup
              title="Earlier"
              notifications={groupedNotifications.older}
              onDismiss={dismiss}
              onAction={handleAction}
            />
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default function Notifications() {
  return (
    <ThreePanelLayout>
      <NotificationsContent />
    </ThreePanelLayout>
  );
}
