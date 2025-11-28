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
import { Skeleton } from "../ui/skeleton";

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
    const [isNote, setIsNote] = useState(false); // 👈 New state for Note
    const [dueDateTime, setDueDateTime] = useState<Date | undefined>(undefined);
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false); // State for drag-and-drop
    const [formSubmitting, setFormSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // Handler for Assignment Switch, ensures mutual exclusivity with Note
    const handleAssignmentChange = (checked: boolean) => {
        setIsAssignment(checked);
        if (checked) {
            setIsNote(false); // If assignment, it cannot be a note
        }
    };

    // Handler for Note Switch, ensures mutual exclusivity with Assignment
    const handleNoteChange = (checked: boolean) => {
        setIsNote(checked);
        if (checked) {
            setIsAssignment(false); // If note, it cannot be an assignment
            setDueDateTime(undefined); // Clear due date if it becomes a note
        }
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formSubmitting) return;

        try {
            if (userRole !== "teacher") {
                toast({
                    title: "Only teachers can create announcements",
                    variant: "destructive",
                });
                return;
            }
            setFormSubmitting(true);

            await ClassroomAnnouncementService.createAnnouncementWithFiles(
                {
                    name,
                    description,
                    classroomId: classromId,
                    isAssignment,
                    isNote, // 👈 Include in payload
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
            setIsNote(false); // 👈 Reset
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
        finally {
            setFormSubmitting(false);
        }
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setIsAssignment(false);
        setIsNote(false); // 👈 Reset
        setDueDateTime(undefined);
        setFiles([]);
    };

    const handleDialogClose = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            resetForm();
        }
    };

    // New drag-and-drop event handlers
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    return (
        <>
            {userRole === "teacher" && (
                <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
                    Share Update
                </Button>
            )}

            <Dialog open={open} onOpenChange={handleDialogClose}>
                <DialogContent
                    className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
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
                                <div className={`border rounded-lg p-4 text-center cursor-pointer border-dashed hover:border-solid transition-colors
                                    ${isDragging ? "border-solid border-primary" : "hover:border-solid"
                                    }`}>
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
                                <Label htmlFor="isAssignment">This is an Assignment</Label>
                                <Switch
                                    id="isAssignment"
                                    checked={isAssignment}
                                    onCheckedChange={handleAssignmentChange} // 👈 Updated handler
                                />
                            </div>

                            {/* Note Switch */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="isNote">This is a Note</Label>
                                <Switch
                                    id="isNote"
                                    checked={isNote}
                                    onCheckedChange={handleNoteChange} // 👈 New handler
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

                        <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-3 sm:p-0 sm:border-0">
                            <DialogFooter className="gap-2 sm:gap-0 sm:justify-end">
                                <DialogClose asChild>
                                    <Button variant="destructive" type="button" className="w-full sm:w-auto">
                                        {formSubmitting ? "Close" : "Cancel"}
                                    </Button>
                                </DialogClose>
                                {!formSubmitting &&
                                    (<Button type="submit" className="w-full sm:w-auto">
                                        Create
                                    </Button>)}
                                {formSubmitting && (
                                    <Skeleton className="w-full sm:w-auto" />
                                )}
                            </DialogFooter>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default AnnouncementButton;