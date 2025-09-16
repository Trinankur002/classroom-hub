import { useEffect, useState } from "react";
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
import AuthService from '@/services/authservice';
import { IClassroomUser } from "@/types/user";
import { set } from "date-fns";

export default function Settings() {
  const [user, setUser] = useState<IClassroomUser | null>(null);

  useEffect(() => {
    fetchUser()
  }, [user]);

  const fetchUser = async () => {
    try {
      const userData = await AuthService.me()
      localStorage.removeItem("user");
      if (userData) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      toast({
        title: "failed to fetch User",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  }

  // const { logout, user } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const { toast } = useToast();

  // active tab state (keeps Tabs + select in sync)
  const TAB_VALUES = ['basics', 'notifications', 'privacy'] as const;
  type TabValue = typeof TAB_VALUES[number];

  const [activeTab, setActiveTab] = useState<TabValue>('basics');

  const [profileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    // bio: user?.bio || "",
    // school: user?.school || "",
    // grade: user?.grade || "",
    // subjects: user?.subjects || [],
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
    fetchUser()
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
            <SelectItem value="basics">Basics</SelectItem>
            <SelectItem value="notifications">Notifications</SelectItem>
            <SelectItem value="privacy">Privacy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="space-y-6">
        <TabsList className="hidden sm:grid grid-cols-3 w-full">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Basics Tab - Merged Profile and Appearance */}
        <TabsContent value="basics" className="space-y-6">
          {/* Enhanced Profile Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
            <CardContent className="relative p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/80 text-white">
                        {user?.name?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      onClick={handleAvatarChange}
                      className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 p-0 shadow-lg"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4 text-center sm:text-left">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">
                      {user?.name || "User Name"}
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
                      <p className="text-lg text-muted-foreground">
                        {user?.email || "user@example.com"}
                      </p>
                      <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
                        {user?.role || "Student"}
                      </Badge>
                    </div>
                  </div>

                  {/* {user?.bio && (
                    <p className="text-muted-foreground leading-relaxed max-w-md">
                      {user.bio}
                    </p>
                  )} */}

                  {/* <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    {user?.school && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-full">
                        <School className="h-4 w-4" />
                        <span>{user.school}</span>
                      </div>
                    )}
                    {user?.grade && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-full">
                        <BookOpen className="h-4 w-4" />
                        <span>Grade {user.grade}</span>
                      </div>
                    )}
                  </div> */}

                  {/* {user?.subjects && user.subjects.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Subjects</Label>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {user.subjects.map((subject, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-card space-y-3 transition-colors">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                  <div className="p-4 border rounded-lg bg-card space-y-3 transition-colors">
                    <div className="h-10 bg-primary rounded w-full flex items-center justify-center hover:bg-primary/90 transition-colors">
                      <span className="text-sm text-primary-foreground font-medium">Sample Button</span>
                    </div>
                    <div className="h-3 bg-muted rounded w-full"></div>
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