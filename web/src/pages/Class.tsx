import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select imports
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Projects from "./AllAssignments";
import ClassDetails from "./ClassDetails";
import { useEffect, useState, useCallback } from "react";
import { IClassroom } from "@/types/classroom";
import ClassroomService from '@/services/classroomService';
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Doubts from "./Doubts";
import AnnouncementButton from "@/components/customComponent/AnnouncementButton";
import AnnouncementDetails from "./AnnouncementDetails";
import Announcements from "./Announcements";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { motion, AnimatePresence } from "framer-motion";

export default function Class() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const userRole = user.role.toString().toLowerCase();
    const { id } = useParams<{ id: string }>();
    const [isloading, setIsLoading] = useState(false);
    const [classroom, setClassroom] = useState<IClassroom>();
    const [refreshKey, setRefreshKey] = useState(0);

    //
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<IClassroomAnnouncement | null>(null);

    const loadClassroom = useCallback(async () => {
        setIsLoading(true);
        try {
            if (id) {
                const { data, error } = await ClassroomService.getClassroomById(id);
                setClassroom(data || null);
                if (error) {
                    toast({
                        title: "Failed to load classroom",
                        description: error,
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!user) {
            navigate("/");
        } else {
            loadClassroom();
        }
    }, [loadClassroom]);

    if (!user) {
        return null;
    }

    const handleAnnouncementChange = () => setRefreshKey(k => k + 1);
    const [activeTab, setActiveTab] = useState("updates");

    const handleTabChange = (newTab: string) => {
        if (newTab) {
            setActiveTab(newTab);
            setRefreshKey(k => k + 1);
            setSelectedAnnouncement(null);
        }
    };
    const [isScrolled, setIsScrolled] = useState(false);

    // Scroll detection logic
    useEffect(() => {
        const handleScroll = () => {
            const scrollThreshold = 50; // Pixels to scroll before it shrinks
            if (window.scrollY > scrollThreshold) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Cleanup the event listener on component unmount
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div>
            <div className="p-4 flex items-center justify-between">
                {/* Left section: Back button + classroom name */}
                {!isloading && classroom ? (
                    <Breadcrumb className="text-2xl" >
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link to="/classrooms">Classrooms</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />

                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    asChild
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedAnnouncement(null);
                                        setActiveTab(activeTab);
                                    }}
                                >
                                    <a href="#">{classroom.name}</a>
                                </BreadcrumbLink>
                            </BreadcrumbItem>

                            {selectedAnnouncement && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{selectedAnnouncement.name}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                ) : (
                    <Skeleton className="h-7 w-48" />
                )}


                {/* Right section: Announcement Button (desktop only) */}
                {!isloading && classroom && userRole === "teacher" && (activeTab === "updates" || activeTab === "announcements") && (
                    <div className="hidden sm:block">
                        <AnnouncementButton
                            userRole={userRole}
                            classromId={classroom.id}
                            onAnnouncementChange={handleAnnouncementChange}
                        />
                    </div>
                )}
            </div>

            <div className="w-full px-4 space-y-6">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full p-5">
                    {/* Desktop Tabs */}
                    <TabsList className="w-full hidden sm:flex overflow-x-auto gap-2">
                        <TabsTrigger className="flex-1 min-w-[120px]" value="updates">
                            <div>All</div>
                            <div className="w-1"></div>
                            <div>Updates</div>
                        </TabsTrigger>
                        <TabsTrigger className="flex-1 min-w-[120px]" value="announcements">Stream</TabsTrigger>
                        <TabsTrigger className="flex-1 min-w-[120px]" value="doubts">Doubts</TabsTrigger>
                        {userRole === 'teacher' && (
                            <TabsTrigger className="flex-1 min-w-[120px]" value="students">Students</TabsTrigger>
                        )}
                    </TabsList>

                    {/* Mobile Dropdown */}
                    <div className="sm:hidden w-full mb-4">
                        <Select value={activeTab} onValueChange={handleTabChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a view" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="updates">All Updates</SelectItem>
                                <SelectItem value="announcements">Stream</SelectItem>
                                <SelectItem value="doubts">Doubts</SelectItem>
                                {userRole === 'teacher' && <SelectItem value="students">Students</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <TabsContent value="updates">
                        {classroom && (
                            <ClassDetails
                                classroom={classroom}
                                key={refreshKey}
                                onViewAnnouncement={(a) => {
                                    setSelectedAnnouncement(a);
                                    setActiveTab("announcements");
                                }}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="announcements">
                        <Announcements
                            selectedAnnouncement={selectedAnnouncement}
                            onBack={() => setSelectedAnnouncement(null)}
                            classroom={classroom}
                            key={refreshKey}
                            onViewAnnouncement={(a) => {
                                setSelectedAnnouncement(a);
                                setActiveTab("announcements");
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="doubts" className="flex-1 flex flex-col">
                        <Doubts classroomId={classroom?.id || ''} />
                    </TabsContent>
                    {userRole === 'teacher' && <TabsContent value="students">List of students</TabsContent>}
                </Tabs>
            </div>

            {/*Create Announcement Button and Mobile FAB with dynamic classes */}
            {!isloading && classroom && userRole === "teacher" && (activeTab === "updates" || activeTab === "announcements") && (
                <div className="fixed bottom-20 right-6 sm:hidden z-50">
                    <div className="hidden">
                        <AnnouncementButton
                            userRole={userRole}
                            classromId={classroom.id}
                            onAnnouncementChange={handleAnnouncementChange}
                        />
                    </div>

                    <Button
                        variant="accent"
                        onClick={() => {
                            const btn = Array.from(document.querySelectorAll("button")).find((el) =>
                                el.textContent?.includes("Create Announcement")
                            ) as HTMLButtonElement | undefined;
                            btn?.click();
                        }}
                        className={`h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-400 ease-in-out ${isScrolled ? 'w-12 px-0' : 'px-4 w-auto'}`}
                    >
                        <Plus className="h-6 w-6" />
                        {!isScrolled && (
                            <span className="ml-2 whitespace-nowrap ease-in-out duration-400 transition-all">
                                Create Announcement
                            </span>
                        )}
                    </Button>
                </div>
            )}

        </div>
    );
}