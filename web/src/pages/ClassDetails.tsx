import { Card } from '@/components/ui/card';
import { IClassroom, IPartialTeacher } from '@/types/classroom';
import { IClassroomAnnouncement } from '@/types/classroomAnnouncement';
import { BookOpen } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import ClassroomAnnouncementService from '@/services/classroomAnnouncementService';
import { toast } from '@/hooks/use-toast';
import AnnouncementCard from '@/components/customComponent/AnnouncementCard';
import AnnouncementCardSkeleton from '@/components/customComponent/AnnouncementCardSkeleton';

interface Props {
    classroom: IClassroom;
}

function ClassDetails({ classroom }: Props) {
    const { id, name, description, joinCode, teacherId, teacher, studentCount, createdAt, updatedAt } = classroom
    const navigate = useNavigate();
    const [isloading, setIsLoading] = useState(false);
    const [announcements, setAnnouncements] = useState<IClassroomAnnouncement[]>();

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        navigate("/");
    }
    const userRole = user.role.toString().toLowerCase()

    const load = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomAnnouncementService.getAll(id)
            setAnnouncements(data);
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
        load();
    }, [])

    return (
        <div>
            <div className="h-3"></div>

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

            {!isloading && announcements && announcements.length > 0 && (
                <div className="space-y-4">
                    {announcements
                        .slice() // clone array to avoid mutating state
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .map((a) => (
                            <AnnouncementCard key={a.id} announcement={a} />
                        ))}
                </div>
            )}
        </div>
    )
}

export default ClassDetails
