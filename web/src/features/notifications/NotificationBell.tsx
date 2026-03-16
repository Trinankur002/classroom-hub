import { useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "./NotificationDropdown";
import { NotificationItem } from "./api";
import { useNotifications } from "./useNotifications";

function getNotificationNavigation(notification: NotificationItem) {
  if (notification.data?.route) {
    return { pathname: notification.data.route };
  }

  if (!notification.entityId) {
    return { pathname: "/dashboard" };
  }

  switch (notification.entityType) {
    case "announcement":
      return {
        pathname: `/classrooms/${notification.entityId}`,
        state: { activeTab: "announcements" },
      };
    case "assignment":
    case "assignment_submission":
    case "assignment_graded":
      return {
        pathname: `/classrooms/${notification.entityId}`,
        state: { activeTab: "announcements" },
      };
    case "live_class":
      return {
        pathname: `/classrooms/${notification.entityId}/live`,
      };
    case "doubt":
      return {
        pathname: `/classrooms/${notification.entityId}`,
        state: { activeTab: "doubts" },
      };
    case "classroom":
      return {
        pathname: `/classrooms/${notification.entityId}`,
      };
    default:
      return { pathname: "/dashboard" };
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } =
    useNotifications();

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markRead(notification.id);
    }
    const route = getNotificationNavigation(notification);
    navigate(route.pathname, { state: route.state });
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1.5 text-center text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-none bg-transparent p-0 shadow-none">
        <NotificationDropdown
          notifications={notifications}
          onOpenNotification={handleOpenNotification}
          onDeleteNotification={(id) => void deleteNotification(id)}
          onMarkAllRead={() => void markAllRead()}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
