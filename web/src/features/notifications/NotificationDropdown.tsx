import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./api";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onOpenNotification: (notification: NotificationItem) => void;
  onDeleteNotification: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationDropdown({
  notifications,
  onOpenNotification,
  onDeleteNotification,
  onMarkAllRead,
}: NotificationDropdownProps) {
  return (
    <div className="w-[340px] rounded-md border bg-popover p-2 shadow-md">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-semibold">Notifications</p>
        <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
          Mark all read
        </Button>
      </div>
      <ScrollArea className="max-h-[360px]">
        <div className="space-y-1">
          {notifications.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          )}

          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start justify-between gap-2 rounded-md px-2 py-2 ${
                notification.isRead ? "bg-transparent" : "bg-muted/70"
              }`}
            >
              <button
                className="flex-1 text-left"
                onClick={() => onOpenNotification(notification)}
              >
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {notification.message}
                </p>
                {(notification.data?.classroomName || notification.data?.entityTitle) && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {[notification.data?.classroomName, notification.data?.entityTitle]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDeleteNotification(notification.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
