import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Projects from "./Projects";
import ClassDetails from "./ClassDetails";
import { useEffect, useState } from "react";
import { IClassroom } from "@/types/classroom";
import ClassroomService from '@/services/classroomService';
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Doubts from "./Doubts";
import AnnouncementButton from "@/components/customComponent/AnnouncementButton";

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

    const load = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomService.getClassroomById(id);
            setClassroom(data);
            if (error) {
                toast({
                    title: "Failed to load classrooms",
                    description: error,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const [activeTab, setActiveTab] = useState("updates");

    return (
        <div>
            <div className="p-4 flex items-center justify-between">
                {/* Left section: Back button + classroom name */}
                <div className="flex items-center space-x-6">
                    <Link to={`/classrooms`}>
                        <Button variant="outline" size="sm" className="gap-1">
                            <ArrowLeft className="h-3 w-3" />
                        </Button>
                    </Link>
                    {!isloading && classroom ? (
                        <h1 className="text-xl font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md">
                            {classroom.name}
                        </h1>
                    ) : (
                        <Skeleton className="h-7 w-48" />
                    )}
                </div>

                {/* Right section: Announcement Button (desktop only) */}
                {!isloading && classroom && userRole === "teacher" && (
                    <div className="hidden sm:block">
                        <AnnouncementButton
                            userRole={userRole}
                            classromId={classroom.id}
                            onAnnouncementChange={load}
                        />
                    </div>
                )}
            </div>

            <div className="w-full px-4 space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full p-5">
                    <TabsList className="w-full flex overflow-x-auto gap-2">
                        <TabsTrigger className="flex-1 min-w-[120px]" value="updates">Updates</TabsTrigger>
                        <TabsTrigger className="flex-1 min-w-[120px]" value="assignments">Assignments</TabsTrigger>
                        <TabsTrigger className="flex-1 min-w-[120px]" value="doubts">Doubts</TabsTrigger>
                        {userRole === 'teacher' && (
                            <TabsTrigger className="flex-1 min-w-[120px]" value="students">Students</TabsTrigger>
                        )}
                    </TabsList>
                    <TabsContent value="updates">{classroom &&
                        <div>
                            <ClassDetails classroom={classroom} />
                        </div>
                    }</TabsContent>
                    <TabsContent value="assignments"><Projects /></TabsContent>
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
                            onAnnouncementChange={load}
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
                        className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
                    >
                        <Plus className="h-6 w-6 text-white" />
                    </Button>
                </div>
            )}
        </div>
    );
}
