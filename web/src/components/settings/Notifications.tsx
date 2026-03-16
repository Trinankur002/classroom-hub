import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, School, BookOpen } from "lucide-react";

interface NotificationsProps {
    notifications: {
        email: boolean;
        push: boolean;
        messages: boolean;
        assignments: boolean;
        grades: boolean;
    };
    userRole?: string;
    setNotifications: (val: NotificationsProps["notifications"]) => void;
}

export default function Notifications({ notifications, userRole, setNotifications }: NotificationsProps) {
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <span>Notification Preferences</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
