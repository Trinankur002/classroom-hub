import { Card } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClassroomAnnouncementService from '@/services/classroomAnnouncementService';
import { IClassroom } from '@/types/classroom'
import ClassroomService from '@/services/classroomService';
import { toast } from '@/hooks/use-toast'
import { IClassroomAnnouncement } from '@/types/classroomAnnouncement'
import AnnouncementCardSkeleton from '@/components/customComponent/AnnouncementCardSkeleton'
import AnnouncementCard from '@/components/customComponent/AnnouncementCard'

function AllAssignments() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const userRole = user.role.toString().toLowerCase();
    const [classrooms, setClassrooms] = useState<IClassroom[]>([])
    const [isloading, setIsLoading] = useState(false);
    const [announcements, setAnnouncements] = useState<IClassroomAnnouncement[]>([])

    const loadClassrooms = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomService.getAllClassrooms();
            setClassrooms(data || []);

            if (error) {
                toast({
                    title: "Failed to load classrooms",
                    description: "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getPendingForClassroomForStudent = async (classromId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomAnnouncementService.getPendingForClassroomForStudent(classromId);
            setAnnouncements(data);

            if (error) {
                toast({
                    title: "Failed to load assignments",
                    description: "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    const getAllPendingAssignmentsForStudent = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomAnnouncementService.getAllPendingAssignmentsForStudent();
            setAnnouncements(data);

            if (error) {
                toast({
                    title: "Failed to load assignments",
                    description: "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            console.log(announcements);

            setIsLoading(false);
        }
    }

    const getMissedForClassroomForStudent = async (classromId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomAnnouncementService.getMissedForClassroomForStudent(classromId);
            setAnnouncements(data);

            if (error) {
                toast({
                    title: "Failed to load assignments",
                    description: "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    const getAllMissedForStudent = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomAnnouncementService.getAllMissedForStudent();
            setAnnouncements(data);

            if (error) {
                toast({
                    title: "Failed to load assignments",
                    description: "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    const load = async () => {
        await loadClassrooms();
        await getAllPendingAssignmentsForStudent()
    }

    useEffect(()=>{
        if (!user) {
            navigate("/");
        }
        load()
    }, [])

    return (
        <div>
            {isloading &&
                <AnnouncementCardSkeleton />
            }

            {!isloading && announcements.length === 0 && (
                < div >
                    <div className="h-3"></div>
                    <Card className="p-12 text-center my-6 mx-6">
                        <div className="space-y-4">
                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">No Assignments Found</h3>
                                <p className="text-muted-foreground">
                                    {userRole === 'teacher'
                                        ? "Create your first project to assign work to students."
                                        : "No tasks have been assigned yet. Check back later!"
                                    }
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {!isloading && announcements.length > 0 && (
                <div>
                    <div className="space-y-4">
                        {[...announcements]
                            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                            .map((a) => (
                                <AnnouncementCard
                                    key={a.id}
                                    announcement={a}
                                    onView={() => navigate(`/classrooms/${a.classroomId}`, { state: { selectedAnnouncementId: a.id } })}
                                />
                            ))}
                    </div>
                </div>
            )}

        </div>
    )
}

export default AllAssignments
