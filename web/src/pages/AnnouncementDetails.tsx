import { Button } from "@/components/ui/button";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClassroomAnnouncementService from '@/services/classroomAnnouncementService';
import { toast } from "@/hooks/use-toast";

interface Props {
    announcementId: string;
    onBack: () => void;
}

export default function AnnouncementDetails({ announcementId, onBack }: Props) {

    const [isloading, setIsLoading] = useState(false);
    const [announcement, setAnnouncement] = useState<IClassroomAnnouncement>();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        navigate("/");
    }
    const userRole = user.role.toString().toLowerCase()

    const load = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomAnnouncementService.getOneAnnouncement(announcementId)
            setAnnouncement(data);
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


            {!isloading && announcement &&
                <div><h2 className="text-xl font-bold">{announcement.name}</h2>
                    <p>{announcement.description}</p>
                </div>

            }
            {/* more details */}
        </div>
    );
}
