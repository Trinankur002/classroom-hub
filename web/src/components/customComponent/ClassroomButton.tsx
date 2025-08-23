import React, { useState } from 'react'
import { Button } from '../ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import ClassroomService from '@/services/classroomService';
import { useToast } from '@/hooks/use-toast';
import { Classroom } from '@/types/classroom';

interface Props {
    userRole: "teacher" | "student";
    onClassroomChange?: () => void;
}

function ClassroomButton({ userRole, onClassroomChange }: Props) {
    const { toast } = useToast();

    const [open, setOpen] = useState(false)

    // Controlled form state
    const [classroomName, setClassroomName] = useState("")
    const [description, setDescription] = useState("")
    const [joinCode, setJoinCode] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        try {
            if (userRole === "teacher") {
                await ClassroomService.createClassroom(classroomName, description)
            } else {
                console.log("Joining classroom with code:", joinCode)
                // TODO: call API -> joinClassroom({ joinCode })
            }
            onClassroomChange?.();
            setOpen(false) // close after saving
            setClassroomName("")
            setDescription("")
            setJoinCode("")
        } catch (error) {
            console.error("Failed to create/join classroom:", error);
            setOpen(false)
            let toastTitle = ""
            if (userRole) {
                toastTitle = 'Failed to Create Classroom'
            } else {
                toastTitle = 'Failed to Join Classroom'
            }
            // Show toast
            toast({
                variant: "destructive",
                title: toastTitle,
            });
        }
    }

    return (
        <>
            <Button variant="accent" size="lg" onClick={() => setOpen(true)}>
                {userRole === "teacher" ? "Create Classroom" : "Join Classroom"}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {userRole === "teacher" ? "Create Classroom" : "Join Classroom"}
                            </DialogTitle>
                            <div className="mt-1"></div>
                            <DialogDescription>
                                {userRole === "teacher"
                                    ? "Fill out details to create a new classroom."
                                    : "Enter classroom code to join."}
                            </DialogDescription>
                            <div className="mt-4"></div>
                        </DialogHeader>

                        {userRole === "teacher" ? (
                            <div className="grid gap-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="classroomName">Name</Label>
                                    <Input
                                        id="classroomName"
                                        name="name"
                                        value={classroomName}
                                        onChange={(e) => setClassroomName(e.target.value)}
                                    />
                                </div>
                                <div className="mt-1"></div>
                                <div className="grid gap-3">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        name="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="joinCode">Join Code</Label>
                                    <Input
                                        id="joinCode"
                                        name="joincode"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="mt-4"></div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="destructive" type="button"  >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit">
                                {userRole === "teacher" ? "Create" : "Join"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ClassroomButton
