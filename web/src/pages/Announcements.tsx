import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import AnnouncementDetails from "./AnnouncementDetails";
import { useNavigate } from "react-router-dom";
import { IClassroom } from "@/types/classroom";
import { useEffect, useState } from "react";
import ClassroomAnnouncementService from '@/services/classroomAnnouncementService';
import { toast } from '@/hooks/use-toast';
import AnnouncementCard from "@/components/customComponent/AnnouncementCard";
import AnnouncementCardSkeleton from "@/components/customComponent/AnnouncementCardSkeleton";
import { Card } from "@/components/ui/card";
import { BookOpen, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
    selectedAnnouncement: IClassroomAnnouncement | null;
    onBack: () => void;
    classroom: IClassroom;
    onViewAnnouncement?: (a: IClassroomAnnouncement) => void;
}

export default function Announcements({ selectedAnnouncement, onBack, classroom, onViewAnnouncement }: Props) {
    const { id, name, description, joinCode, teacherId, teacher, studentCount, createdAt, updatedAt } = classroom
    const [isloading, setIsLoading] = useState(false);
    const [announcements, setAnnouncements] = useState<IClassroomAnnouncement[]>([]);

    const [filter, setFilter] = useState<"all" | "assignments" | "announcements">("all");
    const [isPopoverOpen, setIsPopoverOpen] = useState(false); // Add this state

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));


    const load = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomAnnouncementService.getAll(id)
            setAnnouncements(data || []);

            if (error) {
                toast({
                    title: `Failed to load Details of Classroom ${name}`,
                    description: error,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!user) {
            navigate("/");
        } else {
            load();
        }
    }, [])

    if (!user) {
        return null;
    }

    const userRole = user.role.toString().toLowerCase();

    if (selectedAnnouncement) {

        return <AnnouncementDetails
            announcementId={selectedAnnouncement.id}
            classroomId={id}
            onBack={onBack}
            onDeleteSuccess={load} 
        />;
    }

    const filteredAnnouncements = announcements?.filter(a => {
        if (filter === "assignments") {
            return a.isAssignment;
        }
        if (filter === "announcements") {
            return !a.isAssignment;
        }
        return true;
    }) || [];

    const handleFilterChange = (newFilter: "all" | "assignments" | "announcements") => {
        setFilter(newFilter);
        setIsPopoverOpen(false); // Close the popover after selection
    };

    return (
        <div>
            <div className="h-3"></div>

            {/* Filter Dropdown for medium and large screens */}
            <div className="hidden md:flex justify-end my-4">
                <Select onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="assignments">Assignments</SelectItem>
                        <SelectItem value="announcements">Announcements</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Filter Popover for small screens */}
            <div className="md:hidden flex justify-end my-4">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0">
                        <div className="grid gap-1 p-1">
                            <Button
                                variant={filter === "all" ? "accent" : "ghost"}
                                onClick={() => handleFilterChange("all")}
                                className="justify-start"
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === "assignments" ? "accent" : "ghost"}
                                onClick={() => handleFilterChange("assignments")}
                                className="justify-start"
                            >
                                Assignments
                            </Button>
                            <Button
                                variant={filter === "announcements" ? "accent" : "ghost"}
                                onClick={() => handleFilterChange("announcements")}
                                className="justify-start"
                            >
                                Announcements
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {!isloading && announcements && announcements.length == 0 &&
                <Card className="p-12 text-center my-6">
                    <div className="space-y-4">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">No Updates Here</h3>
                            <p className="text-muted-foreground">
                                {userRole === 'teacher'
                                    ? "Create your first update or assign work to students."
                                    : "No updates for now. Check back later!"
                                }
                            </p>
                        </div>
                    </div>
                </Card>
            }

            {isloading &&
                <AnnouncementCardSkeleton />
            }

            {!isloading && filteredAnnouncements.length > 0 && (
                <div className="space-y-4">
                    {filteredAnnouncements
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .map((a) => (
                            <AnnouncementCard
                                key={a.id}
                                announcement={a}
                                onView={() => onViewAnnouncement?.(a)}
                            />
                        ))}
                </div>
            )}
        </div>
    )
}
