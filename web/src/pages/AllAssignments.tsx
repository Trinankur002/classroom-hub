import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { BookOpen, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import ClassroomAnnouncementService from "@/services/classroomAnnouncementService";
import ClassroomService from "@/services/classroomService";

import AnnouncementCardSkeleton from "@/components/customComponent/AnnouncementCardSkeleton";
import AnnouncementCard from "@/components/customComponent/AnnouncementCard";

import { IClassroom } from "@/types/classroom";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";

/* shadcn-ui components (adjust paths to your project) */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

type FilterType = "pending" | "missed" | "due" | "all";

export default function AllAssignments() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const userRole = user?.role?.toString()?.toLowerCase?.() ?? "student";

    const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>("all");
    const [filterType, setFilterType] = useState<FilterType>("pending");
    const [announcements, setAnnouncements] = useState<IClassroomAnnouncement[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadClassrooms = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data, error } = await ClassroomService.getAllClassrooms();
            setClassrooms(data || []);
            if (error) {
                toast({ title: "Failed to load classrooms", description: "Something went wrong", variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Failed to load classrooms", description: "Something went wrong", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const isDueOrFuture = (maybeDate?: string | Date | null) => {
        if (!maybeDate) return false;
        const d = new Date(maybeDate);
        if (isNaN(d.getTime())) return false;
        // treat "today" as due (i.e., dueDate >= start of today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return d.getTime() >= todayStart.getTime();
    };

    const isPastDue = (maybeDate?: string | Date | null) => {
        if (!maybeDate) return false;
        const d = new Date(maybeDate);
        if (isNaN(d.getTime())) return false;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return d.getTime() < todayStart.getTime();
    };

    const fetchAnnouncements = useCallback(
        async (classroomId: string | "all", fType: FilterType) => {
            setIsLoading(true);
            try {
                // Pending (server)
                if (fType === "pending") {
                    if (classroomId === "all") {
                        const { data, error } = await ClassroomAnnouncementService.getAllPendingAssignmentsForStudent();
                        setAnnouncements(data || []);
                        if (error) toast({ title: "Failed to load assignments", description: "Something went wrong", variant: "destructive" });
                    } else {
                        const { data, error } = await ClassroomAnnouncementService.getPendingForClassroomForStudent(classroomId);
                        setAnnouncements(data || []);
                        if (error) toast({ title: "Failed to load assignments", description: "Something went wrong", variant: "destructive" });
                    }
                }

                // Missed (server)
                else if (fType === "missed") {
                    if (classroomId === "all") {
                        const { data, error } = await ClassroomAnnouncementService.getAllMissedForStudent();
                        setAnnouncements(data || []);
                        if (error) toast({ title: "Failed to load assignments", description: "Something went wrong", variant: "destructive" });
                    } else {
                        const { data, error } = await ClassroomAnnouncementService.getMissedForClassroomForStudent(classroomId);
                        setAnnouncements(data || []);
                        if (error) toast({ title: "Failed to load assignments", description: "Something went wrong", variant: "destructive" });
                    }
                }

                // Due (client-side filter on pending)
                else if (fType === "due") {
                    let fetched: IClassroomAnnouncement[] = [];

                    if (classroomId === "all") {
                        const { data, error } = await ClassroomAnnouncementService.getAllPendingAssignmentsForStudent();
                        if (error) toast({ title: "Failed to load assignments", description: "Something went wrong", variant: "destructive" });
                        fetched = data || [];
                    } else {
                        const { data, error } = await ClassroomAnnouncementService.getPendingForClassroomForStudent(classroomId);
                        if (error) toast({ title: "Failed to load assignments", description: "Something went wrong", variant: "destructive" });
                        fetched = data || [];
                    }

                    // filter by dueDate in future or today
                    const dueFiltered = fetched.filter((a) => isDueOrFuture((a as any).dueDate));
                    setAnnouncements(dueFiltered);
                }

                // All: merge pending + missed (server side where available)
                else if (fType === "all") {
                    const [{ data: pending = [] }, { data: missed = [] }] = await Promise.allSettled([
                        ClassroomAnnouncementService.getAllPendingAssignmentsForStudent(),
                        ClassroomAnnouncementService.getAllMissedForStudent(),
                    ]).then((results) =>
                        results.map((r) => {
                            if (r.status === "fulfilled") return r.value;
                            return { data: [] };
                        })
                    );

                    // merge unique by id
                    const map = new Map<string, IClassroomAnnouncement>();
                    (pending || []).forEach((p: IClassroomAnnouncement) => map.set(p.id, p));
                    (missed || []).forEach((m: IClassroomAnnouncement) => map.set(m.id, m));
                    setAnnouncements(Array.from(map.values()));
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

    // initial load
    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }
        (async () => {
            await loadClassrooms();
            await fetchAnnouncements("all", "pending");
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // re-fetch when classroom or filter changes
    useEffect(() => {
        fetchAnnouncements(selectedClassroomId || "all", filterType);
    }, [selectedClassroomId, filterType, fetchAnnouncements]);

    const sortedAnnouncements = useMemo(() => {
        return [...announcements].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [announcements]);

    // small header counts for current filter (client-side for better immediacy)
    const counts = useMemo(() => {
        const total = announcements.length;
        const due = announcements.filter((a) => isDueOrFuture((a as any).dueDate)).length;
        const missed = announcements.filter((a) => isPastDue((a as any).dueDate)).length;
        return { total, due, missed };
    }, [announcements]);

    return (
        <div className="px-4 sm:px-6 lg:px-8 mt-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Assignments</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View your assignments — filter by classroom, status, or due date.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary">Showing: {filterType.charAt(0).toUpperCase() + filterType.slice(1)}</Badge>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                            Classrooms: {selectedClassroomId === "all" ? classrooms.length : classrooms.find((c) => c.id === selectedClassroomId)?.name}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">Count: {counts.total}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {userRole === "teacher" && (
                        <Button onClick={() => navigate("/assignments/new")}>New Assignment</Button>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-5">
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
                    

                    <div className="hidden md:block">
                        <Tabs defaultValue={filterType} value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                            <TabsList>
                                <TabsTrigger value="pending">Pending</TabsTrigger>
                                <TabsTrigger value="missed">Missed</TabsTrigger>
                                <TabsTrigger value="due">Due</TabsTrigger>
                                <TabsTrigger value="all">All</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* mobile filter sheet */}
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

                                <div>
                                    <label className="block text-sm font-medium mb-2">Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant={filterType === "pending" ? "default" : "ghost"} onClick={() => setFilterType("pending")}>Pending</Button>
                                        <Button variant={filterType === "missed" ? "default" : "ghost"} onClick={() => setFilterType("missed")}>Missed</Button>
                                        <Button variant={filterType === "due" ? "default" : "ghost"} onClick={() => setFilterType("due")}>Due</Button>
                                        <Button variant={filterType === "all" ? "default" : "ghost"} onClick={() => setFilterType("all")}>All</Button>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={() => fetchAnnouncements(selectedClassroomId || "all", filterType)}>Apply</Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Body */}
            {isLoading && <AnnouncementCardSkeleton />}

            {!isLoading && sortedAnnouncements.length === 0 && (
                <div>
                    <div className="h-3" />
                    <Card className="p-12 text-center my-6 mx-0 sm:mx-6">
                        <div className="space-y-4">
                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">No Assignments Found</h3>
                                <p className="text-muted-foreground">
                                    {userRole === "teacher"
                                        ? "Create your first project to assign work to students."
                                        : "No tasks have been assigned yet. Check back later!"}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {!isLoading && sortedAnnouncements.length > 0 && (
                <div className="space-y-4">
                    {sortedAnnouncements.map((a) => (
                        <AnnouncementCard
                            key={a.id}
                            announcement={a}
                            onView={() => navigate(`/classrooms/${a.classroomId}`, { state: { selectedAnnouncementId: a.id } })}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
