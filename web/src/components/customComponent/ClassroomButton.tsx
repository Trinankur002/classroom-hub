import React, { useState } from 'react'
import { Button } from '../ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { set } from 'date-fns';

interface Props { userRole: "teacher" | "student" }

function ClassroomButton({ userRole }: Props) {
    const [open, setOpen] = useState(false)

    // Controlled form state
    const [classroomName, setClassroomName] = useState("")
    const [subject, setSubject] = useState("")
    const [joinCode, setJoinCode] = useState("")

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (userRole === "teacher") {
            console.log("Creating classroom:", { classroomName, subject })
            // TODO: call API -> createClassroom({ classroomName, subject })
        } else {
            console.log("Joining classroom with code:", joinCode)
            // TODO: call API -> joinClassroom({ joinCode })
        }

        setOpen(false) // close after saving
        setClassroomName("")
        setSubject("")
        setJoinCode("")
    }

    return (
        <>
            <Button variant="gradient" size="lg" onClick={() => setOpen(true)}>
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
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input
                                        id="subject"
                                        name="subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
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
