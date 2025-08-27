import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Projects from "./Projects";
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

export default function Class() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        navigate("/");
    }
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
                setClassroom(data);
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
        loadClassroom();
    }, [loadClassroom]);

    const handleAnnouncementChange = () => setRefreshKey(k => k + 1);
    const [activeTab, setActiveTab] = useState("updates");

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
                {!isloading && classroom && userRole === "teacher" && (
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
                <Tabs value={activeTab} onValueChange={(newTab) => {
                    setActiveTab(newTab);
                    setRefreshKey(k => k + 1);
                    setSelectedAnnouncement(null);
                }} className="w-full p-5">
                    <TabsList className="w-full flex overflow-x-auto gap-2">
                        <TabsTrigger className="flex-1 min-w-[120px]" value="updates">
                            <div>All</div>
                            <div className="w-1"></div>
                            <div>Updates</div>
                        </TabsTrigger>
                        <TabsTrigger className="flex-1 min-w-[120px]" value="announcements">Announcements</TabsTrigger>
                        <TabsTrigger className="flex-1 min-w-[120px]" value="doubts">Doubts</TabsTrigger>
                        {userRole === 'teacher' && (
                            <TabsTrigger className="flex-1 min-w-[120px]" value="students">Students</TabsTrigger>
                        )}
                    </TabsList>
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

                    <TabsContent value="doubts"><Doubts /></TabsContent>
                    {userRole === 'teacher' && <TabsContent value="students">List of students</TabsContent>}
                </Tabs>
            </div>

            {/* Mobile FAB */}
            {!isloading && classroom && userRole === "teacher" && (
                <div className="fixed bottom-20 right-6 sm:hidden">
                    {/* Hidden full button so modal logic stays mounted */}
                    <div className="hidden">
                        <AnnouncementButton
                            userRole={userRole}
                            classromId={classroom.id}
                            onAnnouncementChange={handleAnnouncementChange}
                        />
                    </div>

                    {/* Floating circular FAB */}
                    <Button
                        variant="accent"
                        onClick={() => {
                            const btn = Array.from(document.querySelectorAll("button"))
                                .find((el) => el.textContent?.includes("Create Announcement")) as HTMLButtonElement | undefined;
                            btn?.click();
                        }}
                        className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center"
                    >
                        <Plus className="h-6 w-6 text-white" />
                    </Button>
                </div>
            )}
        </div>
    );
}
