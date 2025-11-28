import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { StickyNote, Filter, FileText } from "lucide-react"; // Changed icon to StickyNote/FileText for context
import { toast } from "@/hooks/use-toast";

import ClassroomAnnouncementService from "@/services/classroomAnnouncementService";
import ClassroomService from "@/services/classroomService";

import AnnouncementCardSkeleton from "@/components/customComponent/AnnouncementCardSkeleton";
import AnnouncementCard from "@/components/customComponent/AnnouncementCard";

import { IClassroom } from "@/types/classroom";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";

/* shadcn-ui components */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export default function AllNotesPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>("all");
    const [notes, setNotes] = useState<IClassroomAnnouncement[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Load Classrooms for the Filter Dropdown
    const loadClassrooms = useCallback(async () => {
        try {
            // We don't necessarily set loading true here to avoid full page skeleton just for dropdown data
            const { data, error } = await ClassroomService.getAllClassrooms();
            setClassrooms(data || []);
            if (error) {
                toast({ title: "Failed to load classrooms", description: "Something went wrong", variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Failed to load classrooms", description: "Something went wrong", variant: "destructive" });
        }
    }, []);

    // 2. Fetch Notes based on selected classroom
    const fetchNotes = useCallback(
        async (classroomId: string | "all") => {
            setIsLoading(true);
            try {
                // If "all", we pass undefined to the service, otherwise we pass the ID
                const params = classroomId === "all" ? {} : { classroomId };

                const { data, error } = await ClassroomAnnouncementService.getNotesForStudent(params);

                setNotes(data || []);

                if (error) {
                    toast({ title: "Failed to load notes", description: error, variant: "destructive" });
                }
            } catch (err) {
                console.error(err);
                toast({ title: "Failed", description: "Something went wrong", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    // Initial Load
    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }
        (async () => {
            await loadClassrooms();
            await fetchNotes("all");
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-fetch when filter changes
    useEffect(() => {
        fetchNotes(selectedClassroomId || "all");
    }, [selectedClassroomId, fetchNotes]);

    // Sort by Date (newest first)
    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [notes]);

    return (
        <div className="px-4 sm:px-6 lg:px-8 mt-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Classroom Notes</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View study materials and notes shared by your teachers.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary">Type: Notes</Badge>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                            Classrooms: {selectedClassroomId === "all" ? "All" : classrooms.find((c) => c.id === selectedClassroomId)?.name || "Selected"}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">Count: {notes.length}</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-5">
                    {/* Desktop Filter */}
                    <div className="hidden md:block">
                        <Select onValueChange={(v) => setSelectedClassroomId(v || "all")} defaultValue="all">
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Classrooms" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classrooms</SelectItem>
                                {classrooms.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Mobile Filter Sheet */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Filters
                            </Button>
                        </SheetTrigger>

                        <SheetContent side="right" className="w-[300px]">
                            <h3 className="text-lg font-medium mb-4">Filters</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Classroom</label>
                                    <Select onValueChange={(v) => setSelectedClassroomId(v || "all")} defaultValue={selectedClassroomId || "all"}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="All Classrooms" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Classrooms</SelectItem>
                                            {classrooms.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={() => fetchNotes(selectedClassroomId || "all")}>Apply</Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Body */}
            {isLoading && <AnnouncementCardSkeleton />}

            {!isLoading && sortedNotes.length === 0 && (
                <div>
                    <div className="h-3" />
                    <Card className="p-12 text-center my-6 mx-0 sm:mx-6">
                        <div className="space-y-4">
                            <StickyNote className="h-12 w-12 text-muted-foreground mx-auto" />
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">No Notes Found</h3>
                                <p className="text-muted-foreground">
                                    Your teachers haven't posted any notes in the selected classroom(s) yet.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {!isLoading && sortedNotes.length > 0 && (
                <div className="space-y-4">
                    {sortedNotes.map((note) => (
                        <AnnouncementCard
                            key={note.id}
                            announcement={note}
                            // When clicking view, we generally want to go to the specific classroom view
                            onView={() => navigate(`/classrooms/${note.classroomId}`, { state: { selectedAnnouncementId: note.id } })}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}