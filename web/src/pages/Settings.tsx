import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Moon,
  Sun,
  Bell,
  Shield,
  Camera,
  Mail,
  School,
  BookOpen,
} from "lucide-react";
import { useThemeStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const { toast } = useToast();

  // active tab state (keeps Tabs + select in sync)
  const TAB_VALUES = ['profile', 'appearance', 'notifications', 'privacy'] as const;
  type TabValue = typeof TAB_VALUES[number];

  const [activeTab, setActiveTab] = useState<TabValue>('profile');

  const [profileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    school: user?.school || "",
    grade: user?.grade || "",
    subjects: user?.subjects || [],
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    messages: true,
    assignments: true,
    grades: true,
  });

  const handleAvatarChange = () => {
    // TODO: Implement avatar upload
    toast({
      title: "Coming Soon",
      description: "Avatar upload will be available soon.",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      {/* Mobile: simple select to pick tab, Desktop: TabsList */}
      <div className="sm:hidden">
        <Select value={activeTab} onValueChange={(v: TabValue) => setActiveTab(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a tab" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="profile">Profile</SelectItem>
            <SelectItem value="appearance">Appearance</SelectItem>
            <SelectItem value="notifications">Notifications</SelectItem>
            <SelectItem value="privacy">Privacy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="space-y-6">
        <TabsList className="hidden sm:grid grid-cols-4 w-full">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-lg font-semibold bg-gradient-primary text-white">
                    {user?.name?.slice(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  
                  <Badge variant="secondary" className="capitalize">
                    {user?.role}
                  </Badge>
                  <Button variant="outline" onClick={handleAvatarChange} className="gap-2">
                    <Camera className="h-4 w-4" />
                    Change Avatar
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Read-only display fields (no inputs) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{user?.name}</h3>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{user?.email}</h3>
                </div>
              </div>

              {/* NOTE: Only avatar is editable here. */}
            </CardContent>
          </Card>
        </TabsContent>


        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {theme === "light" ? (
                  <Sun className="h-5 w-5 text-primary" />
                ) : (
                  <Moon className="h-5 w-5 text-primary" />
                )}
                <span>Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">Preview</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-card space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-2 bg-muted rounded w-1/2"></div>
                    <div className="h-2 bg-muted rounded w-2/3"></div>
                  </div>
                  <div className="p-4 border rounded-lg bg-card space-y-2">
                    <div className="h-8 bg-primary rounded w-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-medium">Button</span>
                    </div>
                    <div className="h-2 bg-muted rounded w-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "email", label: "Email Notifications", description: "Receive notifications via email", icon: Mail },
                { key: "messages", label: "Chat Messages", description: "New messages in classrooms", icon: Bell },
                { key: "assignments", label: "Assignment Updates", description: "Due dates and new assignments", icon: BookOpen },
                { key: "grades", label: "Grade Updates", description: "When grades are posted", icon: School },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-1">
                      <Label className="text-base font-medium">{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Privacy & Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Password</Label>
                  <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                  <Button variant="outline">Change Password</Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base font-medium">Data Export</Label>
                  <p className="text-sm text-muted-foreground">Download a copy of your data</p>
                  <Button variant="outline">Download Data</Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base font-medium text-destructive">Danger Zone</Label>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
