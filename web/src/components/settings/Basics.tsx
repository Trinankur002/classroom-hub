import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon, Camera } from "lucide-react";
import { IClassroomUser } from "@/types/user";

interface BasicsProps {
    user: IClassroomUser | null;
    theme: string;
    toggleTheme: () => void;
    handleAvatarButtonClick: () => void;
    logout: () => void;
}

export default function Basics({ user, theme, toggleTheme, handleAvatarButtonClick, logout }: BasicsProps) {
    return (
        <div className="space-y-6">
            {/* Profile Card */}
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
                <CardContent className="relative p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:space-y-0 sm:space-x-8 space-y-6">
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
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 space-y-4 text-center sm:text-left">
                            <h2 className="text-3xl font-bold">{user?.name || "User Name"}</h2>
                            <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
                                <p className="text-lg text-muted-foreground">{user?.email || "user@example.com"}</p>
                                <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
                                    {user?.role || "Student"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        {theme === "light" ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
                        <span>Appearance</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base font-medium">Dark Mode</Label>
                            <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                        </div>
                        <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <Label className="text-base font-medium">Preview</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg bg-card space-y-3">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                                <div className="h-3 bg-muted rounded w-2/3"></div>
                            </div>
                            <div className="p-4 border rounded-lg bg-card space-y-3">
                                <div className="h-10 bg-primary rounded w-full flex items-center justify-center">
                                    <span className="text-sm text-primary-foreground font-medium">Sample Button</span>
                                </div>
                                <div className="h-3 bg-muted rounded w-full"></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end sm:hidden">
                <Button variant="destructive" size="lg" className="w-full" onClick={logout}>
                    Logout
                </Button>
            </div>
        </div>
    );
}
