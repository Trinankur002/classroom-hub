import { Button } from "@/components/ui/button";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import { ArrowLeft } from "lucide-react";

interface Props {
    announcement: IClassroomAnnouncement;
    onBack: () => void;
}

export default function AnnouncementDetails({ announcement, onBack }: Props) {
    return (
        <div>

            <h2 className="text-xl font-bold">{announcement.name}</h2>
            <p>{announcement.description}</p>
            {/* more details */}
        </div>
    );
}
