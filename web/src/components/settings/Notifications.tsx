import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, School, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationsProps {
    notifications: {
        email: boolean;
        push: boolean;
        messages: boolean;
        assignments: boolean;
        grades: boolean;
    };
    userRole?: string;
    pushPermission?: NotificationPermission | "unsupported";
    onEnablePush?: () => void;
    pushActionLoading?: boolean;
    setNotifications: (val: NotificationsProps["notifications"]) => void;
}

export default function Notifications({
    notifications,
    userRole,
    pushPermission,
    onEnablePush,
    pushActionLoading,
    setNotifications,
}: NotificationsProps) {
    const normalizedRole = (userRole || "").toLowerCase();
    const isTeacher = normalizedRole === "teacher";

    const commonItems = [
        { key: "email", label: "Email Notifications", description: "Receive notifications via email", icon: Mail },
        { key: "push", label: "Push Notifications", description: "Receive browser/device notifications", icon: Bell },
    ] as const;

    const roleItems = isTeacher
        ? [
            { key: "messages", label: "Classroom Activity", description: "Student joins, doubts, and live class updates", icon: Bell },
            { key: "assignments", label: "Submission Alerts", description: "When students submit assignments", icon: BookOpen },
        ] as const
        : [
            { key: "messages", label: "Classroom Messages", description: "Announcements, doubts, and live class updates", icon: Bell },
            { key: "assignments", label: "Assignment Updates", description: "New assignments and reminders", icon: BookOpen },
            { key: "grades", label: "Grade Updates", description: "When your submissions are graded", icon: School },
        ] as const;

    const items = [...commonItems, ...roleItems];

    const applyPreset = (preset: "all" | "essential" | "minimal") => {
        if (preset === "all") {
            setNotifications({ ...notifications, email: true, push: true, messages: true, assignments: true, grades: true });
            return;
        }
        if (preset === "essential") {
            setNotifications({ ...notifications, email: false, push: true, messages: true, assignments: true, grades: !isTeacher });
            return;
        }
        setNotifications({ ...notifications, email: false, push: false, messages: false, assignments: true, grades: false });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <span className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary shrink-0" />
                        <span className="leading-tight">Notification Preferences</span>
                    </span>
                    <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => applyPreset("all")}>All</Button>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => applyPreset("essential")}>Essential</Button>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => applyPreset("minimal")}>Minimal</Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {pushPermission && pushPermission !== "granted" && (
                    <div className="rounded-md border border-amber-300/40 bg-amber-500/10 p-3">
                        <p className="text-sm font-medium text-amber-200">Browser push permission is off</p>
                        <p className="mt-1 text-xs text-amber-100/90">
                            {pushPermission === "denied"
                                ? "Notifications are blocked in browser settings."
                                : "Enable browser permission to receive background notifications."}
                        </p>
                        {pushPermission !== "denied" && onEnablePush && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={onEnablePush}
                                disabled={pushActionLoading}
                            >
                                {pushActionLoading ? "Enabling..." : "Enable Browser Push"}
                            </Button>
                        )}
                    </div>
                )}
                {items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                            <div className="space-y-1">
                                <Label className="text-base font-medium">{item.label}</Label>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        </div>
                        <Switch
                            checked={notifications[item.key]}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
