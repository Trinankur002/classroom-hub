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
    onViewAnnouncement?: (a: IClassroomAnnouncement) => void;
}

function ClassDetails({ classroom ,onViewAnnouncement}: Props) {
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
        <h1>Class Details</h1>
    )
}

export default ClassDetails
