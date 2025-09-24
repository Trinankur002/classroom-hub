import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
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
  EyeOff,
  Eye,
} from "lucide-react";
import { useThemeStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthService from '@/services/authservice';
import { IClassroomUser } from "@/types/user";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // adapt if exports differ
import { Slider } from "@/components/ui/slider"; // optional for zoom control

// helper to create a blob from canvas
async function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }, rotation = 0): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous"); // needed for CORS-safe canvas export
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      // fallback if null
      if (!blob) {
        // create empty blob
        const fallback = new Blob([], { type: "image/png" });
        resolve(fallback);
      } else {
        resolve(blob);
      }
    }, "image/png");
  });
}

export default function Settings() {
  const [user, setUser] = useState<IClassroomUser | null>(null);

  useEffect(() => {
    fetchUser();
  }, []); // run once on mount

  const fetchUser = async () => {
    try {
      const userData = await AuthService.me();
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
  };

  const { theme, toggleTheme } = useThemeStore();
  const { toast } = useToast();

  // active tab state (keeps Tabs + select in sync)
  const TAB_VALUES = ['basics', 'notifications', 'privacy'] as const;
  type TabValue = typeof TAB_VALUES[number];

  const [activeTab, setActiveTab] = useState<TabValue>('basics');

  const [profileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    messages: true,
    assignments: true,
    grades: true,
  });

  // --- Avatar upload + crop states ---
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null); // original image for cropper
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Change Password dialog state
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changing, setChanging] = useState(false);


  const handleChangePassword = async () => {
    // basic validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters", variant: "destructive" });
      return;
    }

    setChanging(true);
    try {
      const resp = await AuthService.changePassword({ oldPassword, newPassword });
      // assume API returns { access_token: "...", ... } or similar
      const accessToken = resp?.access_token ?? resp?.token ?? resp?.accessToken ?? resp;
      if (typeof accessToken === "string") {
        localStorage.setItem("token", accessToken);
      } else if (accessToken && accessToken.access_token) {
        localStorage.setItem("token", accessToken.access_token);
      } else {
        // if API returned entire object, stringify fallback (rare)
        // but prefer a string token; if not present, still notify success
        // (you can change this behavior depending on your backend shape)
      }

      // success UX
      toast({ title: "Password changed", description: "Your session token was updated." });
      setChangePwOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Change password failed", err);
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to change password";
      toast({ title: "Failed to change password", description: msg, variant: "destructive" });
    } finally {
      setChanging(false);
    }
  };


  const onFileSelected = async (file?: File) => {
    const f = file ?? inputFileRef.current?.files?.[0];
    if (!f) return;
    // only images
    if (!f.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageDataUrl(reader.result as string);
      setIsCropOpen(true);
      // reset crop/zoom
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(f);
  };

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    // croppedPixels contains x, y, width, height in px of the source image
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirmCrop = async () => {
    if (!selectedImageDataUrl || !croppedAreaPixels) {
      toast({ title: "Nothing to crop", description: "Select an image first.", variant: "destructive" });
      return;
    }
    try {
      setIsUploading(true);
      const blob = await getCroppedImg(selectedImageDataUrl, croppedAreaPixels);
      // convert blob to File (preserve png)
      const file = new File([blob], `avatar_${user?.id ?? "me"}.png`, { type: "image/png" });

      // call your existing AuthService function (note original spelled changeAvater)
      await AuthService.changeAvater(file);

      // refetch user and close dialog
      await fetchUser();
      setIsCropOpen(false);
      setSelectedImageDataUrl(null);
      toast({ title: "Avatar updated", description: "Your avatar was successfully updated." });
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", description: "Could not upload avatar.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarButtonClick = () => {
    // open file picker
    inputFileRef.current?.click();
  };
  const { logout } = useAuth();

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

      {/* hidden file input for avatar */}
      <input
        type="file"
        accept="image/*"
        ref={inputFileRef}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelected(f);
          // reset input so same file re-select works
          e.currentTarget.value = "";
        }}
      />

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

        {/* Basics Tab */}
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
                      onClick={handleAvatarButtonClick}
                      className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 p-0 shadow-lg"
                      aria-label="Change avatar"
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings (unchanged) */}
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

          <div className="flex justify-end sm:hidden">
            <Button
            variant="destructive"
            size='lg'
            className="w-full"
            onClick={logout}
          >
            Logout
          </Button>
          </div>

          
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
                {/* Password */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Password</Label>
                  <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                  <Button variant="outline" onClick={() => setChangePwOpen(true)}>Change Password</Button>
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

      {/* Crop Dialog */}
      <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>Crop avatar (square)</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full h-64 sm:h-96 bg-black/5">
              {selectedImageDataUrl ? (
                <Cropper
                  image={selectedImageDataUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No image selected</div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <Label className="text-sm">Zoom</Label>
                <div className="py-2">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Preview</Label>
                <div className="w-28 h-28 overflow-hidden rounded bg-muted flex items-center justify-center">
                  {/* small preview by creating an <img> using the current cropped area (best-effort) */}
                  {selectedImageDataUrl ? (
                    <img src={selectedImageDataUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Choose a different file</Label>
                <div className="flex space-x-2">
                  <Button onClick={() => inputFileRef.current?.click()}>Select file</Button>
                  <Button variant="ghost" onClick={() => { setSelectedImageDataUrl(null); setIsCropOpen(false); }}>Cancel</Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => { setIsCropOpen(false); setSelectedImageDataUrl(null); }}>Close</Button>
            <Button onClick={handleConfirmCrop} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Save avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={changePwOpen} onOpenChange={setChangePwOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Old password */}
            <div>
              <Label className="mb-2">Current password</Label>
              <div className="relative">
                <Input
                  type={showOld ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showOld ? "Hide password" : "Show password"}
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-muted/30"
                >
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <Label className="mb-2">New password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showNew ? "Hide password" : "Show password"}
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-muted/30"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Use at least 8 characters.</p>
            </div>

            {/* Confirm password */}
            <div>
              <Label className="mb-2">Confirm new password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-muted/30"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setChangePwOpen(false)} disabled={changing}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={changing}>
              {changing ? "Saving..." : "Change password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
