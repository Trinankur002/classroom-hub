import React, { useState } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ClassroomAnnouncementService from "@/services/classroomAnnouncementService";
import { Switch } from "../ui/switch";
import { X } from "lucide-react";
import { format } from "date-fns";
import { DateTimePicker } from "./DateTimePicker"; // Adjust import path as needed

interface Props {
    userRole: "teacher" | "student";
    classromId: string;
    onAnnouncementChange?: () => void;
}

function AnnouncementButton({ userRole, classromId, onAnnouncementChange }: Props) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    // Controlled form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isAssignment, setIsAssignment] = useState(false);
    const [dueDateTime, setDueDateTime] = useState<Date | undefined>(undefined);
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            if (userRole !== "teacher") {
                toast({
                    title: "Only teachers can create announcements",
                    variant: "destructive",
                });
                return;
            }

            await ClassroomAnnouncementService.createAnnouncementWithFiles(
                {
                    name,
                    description,
                    classroomId: classromId,
                    isAssignment,
                    dueDate: dueDateTime?.toISOString() || undefined,
                },
                files
            );

            onAnnouncementChange?.();
            setOpen(false);

            // Reset form
            setName("");
            setDescription("");
            setIsAssignment(false);
            setDueDateTime(undefined);
            setFiles([]);

            onAnnouncementChange?.()

        } catch (error) {
            console.error("Failed to create announcement:", error);
            setOpen(false);
            toast({
                variant: "destructive",
                title: "Failed to Create Announcement",
            });
        }
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setIsAssignment(false);
        setDueDateTime(undefined);
        setFiles([]);
    };

    const handleDialogClose = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            resetForm();
        }
    };

    return (
        <>
            {userRole === "teacher" && (
                <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
                    Create Announcement
                </Button>
            )}

            <Dialog open={open} onOpenChange={handleDialogClose}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Create Announcement</DialogTitle>
                            <DialogDescription>
                                Fill out details to create a new announcement.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Title */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">Title</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Files */}
                            <div className="grid gap-2">
                                <Label>Files</Label>
                                <div className="border rounded-lg p-4 text-center cursor-pointer border-dashed hover:border-solid transition-colors">
                                    <Input
                                        id="files"
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="files" className="cursor-pointer text-muted-foreground">
                                        Drag and drop files here or click to browse
                                    </label>
                                </div>

                                {/* File Preview */}
                                {files.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {files.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center px-3 py-1 rounded-md border text-sm bg-muted"
                                            >
                                                <span className="truncate max-w-[120px]">{file.name}</span>
                                                <button
                                                    type="button"
                                                    className="ml-2 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeFile(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Assignment Switch */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="isAssignment">Is Assignment?</Label>
                                <Switch
                                    id="isAssignment"
                                    checked={isAssignment}
                                    onCheckedChange={setIsAssignment}
                                />
                            </div>

                            {/* Due Date and Time Picker */}
                            {isAssignment && (
                                <DateTimePicker
                                    label="Due Date & Time"
                                    value={dueDateTime}
                                    onChange={setDueDateTime}
                                    minDate={new Date()} // Prevent selecting past dates
                                    placeholder="Select due date and time"
                                />
                            )}
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="destructive" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default AnnouncementButton;