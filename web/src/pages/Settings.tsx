import { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

import { useThemeStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AuthService from "@/services/authservice";
import { IClassroomUser } from "@/types/user";
import Basics from "@/components/settings/Basics";
import Notifications from "@/components/settings/Notifications";
import Privacy from "@/components/settings/Privacy";
import AvatarUpload from "@/components/settings/AvatarUpload";
import ChangePassword from "@/components/settings/ChangePassword";

// helper to create a blob from canvas
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
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
      if (!blob) {
        resolve(new Blob([], { type: "image/png" }));
      } else {
        resolve(blob);
      }
    }, "image/png");
  });
}

export default function Settings() {
  const [user, setUser] = useState<IClassroomUser | null>(null);

  const { theme, toggleTheme } = useThemeStore();
  const { toast } = useToast();
  const { logout } = useAuth();

  // Tabs
  const TAB_VALUES = ["basics", "notifications", "privacy"] as const;
  type TabValue = typeof TAB_VALUES[number];
  const [activeTab, setActiveTab] = useState<TabValue>("basics");

  // Notifications
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    messages: true,
    assignments: true,
    grades: true,
  });

  // Avatar upload + crop
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Change Password
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changing, setChanging] = useState(false);

  // Load user
  useEffect(() => {
    fetchUser();
  }, []);

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

  // Avatar handlers
  const onFileSelected = async (file?: File) => {
    const f = file ?? inputFileRef.current?.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageDataUrl(reader.result as string);
      setIsCropOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(f);
  };

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
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
      const file = new File([blob], `avatar_${user?.id ?? "me"}.png`, { type: "image/png" });

      await AuthService.changeAvater(file);
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
    inputFileRef.current?.click();
  };

  // Change password handler
  const handleChangePassword = async () => {
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
      const accessToken = resp?.access_token ?? resp?.token ?? resp?.accessToken ?? resp;
      if (typeof accessToken === "string") {
        localStorage.setItem("token", accessToken);
      } else if (accessToken?.access_token) {
        localStorage.setItem("token", accessToken.access_token);
      }

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

      {/* hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={inputFileRef}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelected(f);
          e.currentTarget.value = "";
        }}
      />

      {/* Mobile Select */}
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

      {/* Desktop Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="space-y-6">
        <TabsList className="hidden sm:grid grid-cols-3 w-full">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="basics">
          <Basics
            user={user}
            theme={theme}
            toggleTheme={toggleTheme}
            handleAvatarButtonClick={handleAvatarButtonClick}
            logout={logout}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <Notifications notifications={notifications} setNotifications={setNotifications} />
        </TabsContent>

        <TabsContent value="privacy">
          <Privacy onOpenChangePassword={() => setChangePwOpen(true)} />
        </TabsContent>
      </Tabs>

      {/* Avatar Upload Dialog */}
      <AvatarUpload
        isCropOpen={isCropOpen}
        setIsCropOpen={setIsCropOpen}
        selectedImageDataUrl={selectedImageDataUrl}
        setSelectedImageDataUrl={setSelectedImageDataUrl}
        crop={crop}
        setCrop={setCrop}
        zoom={zoom}
        setZoom={setZoom}
        onCropComplete={onCropComplete}
        handleConfirmCrop={handleConfirmCrop}
        isUploading={isUploading}
        inputFileRef={inputFileRef}
      />

      {/* Change Password Dialog */}
      <ChangePassword
        open={changePwOpen}
        setOpen={setChangePwOpen}
        oldPassword={oldPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        showOld={showOld}
        showNew={showNew}
        showConfirm={showConfirm}
        setOldPassword={setOldPassword}
        setNewPassword={setNewPassword}
        setConfirmPassword={setConfirmPassword}
        setShowOld={setShowOld}
        setShowNew={setShowNew}
        setShowConfirm={setShowConfirm}
        handleChangePassword={handleChangePassword}
        changing={changing}
      />
    </div>
  );
}
