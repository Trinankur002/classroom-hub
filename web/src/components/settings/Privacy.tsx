import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";

interface PrivacyProps {
    onOpenChangePassword: () => void;
}

export default function Privacy({ onOpenChangePassword }: PrivacyProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span>Privacy & Security</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-base font-medium">Password</Label>
                    <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                    <Button variant="outline" onClick={onOpenChangePassword}>Change Password</Button>
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label className="text-base font-medium text-destructive">Danger Zone</Label>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    <Button variant="destructive">Delete Account</Button>
                </div>
            </CardContent>
        </Card>
    );
}
