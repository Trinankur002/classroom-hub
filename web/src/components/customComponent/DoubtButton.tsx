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
import DoubtService from "@/services/doubtService";
import { X } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface Props {
    userRole: "teacher" | "student";
    classromId: string;
    onDoubtChange?: () => void;
}

function DoubtButton({ userRole, classromId, onDoubtChange }: Props) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    // Controlled form state
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);

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
        if (formSubmitting) return;

        try {
            if (userRole !== "student") {
                toast({
                    title: "Only students can create doubts",
                    variant: "destructive",
                });
                return;
            }
            setFormSubmitting(true);

            const { error } = await DoubtService.createDoubtWithFiles(
                {
                    doubtDescribtion: description,
                    classroomId: classromId,
                },
                files
            );

            if (error) {
                throw new Error(error);
            }

            onDoubtChange?.();
            setOpen(false);
            resetForm();

            toast({
                title: "Doubt created successfully!",
            });

        } catch (error: any) {
            console.error("Failed to create doubt:", error);
            toast({
                variant: "destructive",
                title: "Failed to Create Doubt",
                description: error.message || "Something went wrong",
            });
        }
        finally {
            setFormSubmitting(false);
        }
    };

    const resetForm = () => {
        setDescription("");
        setFiles([]);
    };

    const handleDialogClose = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            resetForm();
        }
    };

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
            {userRole === "student" &&
                <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
                    Ask a Doubt
                </Button>}
            
            <Dialog open={open} onOpenChange={handleDialogClose}>
                <DialogContent
                    className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <form onSubmit={handleSubmit} className={`transition-opacity duration-300 ${isDragging ? 'opacity-20' : 'opacity-100'}`}>
                        <DialogHeader>
                            <DialogTitle>Ask a Doubt</DialogTitle>
                            <DialogDescription>
                                Describe your doubt and attach files if necessary.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                            </div>

                            <div className="grid gap-2">
                                <Label>Files (Optional)</Label>
                                <div className={`border rounded-lg p-4 text-center cursor-pointer border-dashed hover:border-solid transition-colors`}>
                                    <Input id="files" type="file" multiple className="hidden" onChange={handleFileChange} />
                                    <label htmlFor="files" className="cursor-pointer text-muted-foreground">Drag and drop files here or click to browse</label>
                                </div>

                                {files.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {files.map((file, index) => (
                                            <div key={index} className="flex items-center px-3 py-1 rounded-md border text-sm bg-muted">
                                                <span className="truncate max-w-[120px]">{file.name}</span>
                                                <button type="button" className="ml-2 text-muted-foreground hover:text-destructive" onClick={() => removeFile(index)}><X className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 sm:justify-end pt-4 border-t">
                            <DialogClose asChild><Button variant="destructive" type="button" className="w-full sm:w-auto">{formSubmitting ? "Close" : "Cancel"}</Button></DialogClose>
                            {formSubmitting ? <Skeleton className="h-10 w-20" /> : <Button type="submit" className="w-full sm:w-auto">Create</Button>}
                        </DialogFooter>
                    </form>
                    {isDragging && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="p-6 text-center border-2 border-dashed rounded-lg border-primary">Drop files to upload</div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export default DoubtButton;
