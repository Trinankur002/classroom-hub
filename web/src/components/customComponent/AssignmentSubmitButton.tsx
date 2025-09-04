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
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AssignmentService from "@/services/assignmentService";

interface Props {
    userRole: "teacher" | "student";
    assignmentId: string;
    onAssignmentSubmit?: () => void;
}

function AssignmentSubmitButton({ userRole, assignmentId, onAssignmentSubmit }: Props) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false); // New state for drag-and-drop

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (userRole !== "student") {
            toast({
                title: "Only students can submit assignments",
                variant: "destructive",
            });
            return;
        }

        if (files.length === 0) {
            toast({
                title: "Please select at least one file",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const result = await AssignmentService.submitAssignment(assignmentId, files);

            if (result.error) {
                toast({
                    title: "Submission Failed",
                    description: result.error,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Assignment Submitted",
                    description: "Your files were uploaded successfully",
                });
                onAssignmentSubmit?.();
                setOpen(false);
                setFiles([]);
            }
        } catch (err) {
            console.error("Error submitting assignment:", err);
            toast({
                title: "Submission Failed",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {userRole === "student" && (
                <Button size="sm" onClick={() => setOpen(true)}>
                    Submit Assignment
                </Button>
            )}

            <Dialog
                open={open}
                onOpenChange={setOpen}
            >
                <DialogContent className="max-w-lg"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Submit Assignment</DialogTitle>
                            <DialogDescription>
                                Upload your assignment files for this submission.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* File input */}
                            <div className="grid gap-2">
                                <Label>Files</Label>
                                <div
                                    className={`border rounded-lg p-4 text-center cursor-pointer border-dashed transition-colors ${isDragging ? "border-solid border-primary" : "hover:border-solid"
                                        }`}
                                >
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
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="destructive" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Submitting..." : "Submit"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default AssignmentSubmitButton;