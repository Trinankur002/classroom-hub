import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface ChangePasswordProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
    showOld: boolean;
    showNew: boolean;
    showConfirm: boolean;
    setOldPassword: (v: string) => void;
    setNewPassword: (v: string) => void;
    setConfirmPassword: (v: string) => void;
    setShowOld: (v: boolean) => void;
    setShowNew: (v: boolean) => void;
    setShowConfirm: (v: boolean) => void;
    handleChangePassword: () => void;
    changing: boolean;
}

export default function ChangePassword({
    open,
    setOpen,
    oldPassword,
    newPassword,
    confirmPassword,
    showOld,
    showNew,
    showConfirm,
    setOldPassword,
    setNewPassword,
    setConfirmPassword,
    setShowOld,
    setShowNew,
    setShowConfirm,
    handleChangePassword,
    changing,
}: ChangePasswordProps) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-muted/30"
                            >
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 flex justify-end space-x-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={changing}>Cancel</Button>
                    <Button onClick={handleChangePassword} disabled={changing}>
                        {changing ? "Saving..." : "Change password"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
