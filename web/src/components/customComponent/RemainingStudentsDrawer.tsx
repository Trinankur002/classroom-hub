import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { Drawer } from "vaul";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    students: User[];
}

export default function RemainingStudentsDrawer({ open, onOpenChange, students }: Props) {
    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl h-[70vh]">
                    <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted cursor-grab" />
                    <Drawer.Title className="px-4 font-semibold text-lg">Remaining Students</Drawer.Title>
                    <Drawer.Description className="px-4 text-sm text-muted-foreground">
                        Students who have not submitted the assignment yet
                    </Drawer.Description>

                    <div className="px-4 mt-4 overflow-y-auto h-[calc(70vh-120px)] pb-6">
                        {students.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground">All students have submitted 🎉</div>
                        ) : (
                            <div className="space-y-3">
                                {students.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center gap-3 border rounded-lg p-3 bg-card"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={s.avatarUrl || undefined} alt={s.name} />
                                            <AvatarFallback>{(s.name || "U")[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="font-medium">{s.name}</div>
                                            <div className="text-xs text-muted-foreground">{s.email || s.role}</div>
                                        </div>
                                        {/* <Button size="sm" variant="ghost">Remind</Button> */}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}