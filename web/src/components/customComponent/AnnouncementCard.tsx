import { Card } from "@/components/ui/card";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import FilePreview from "./FilePreview";
import { format } from "date-fns";

interface Props {
    announcement: IClassroomAnnouncement;
}

export default function AnnouncementCard({ announcement }: Props) {
    const formattedDueDate = announcement.dueDate
        ? format(new Date(announcement.dueDate), "MMM dd, yyyy h:mm a") // <-- AM/PM format
        : "No due date";

    return (
        <Card className="p-4 space-y-3">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold">{announcement.name}</h3>
                <p className="text-sm text-muted-foreground">{announcement.description}</p>
            </div>

            <FilePreview files={announcement.files} />

            <div className="text-xs text-muted-foreground flex justify-between">
                <span>By {announcement.teacher.name}</span>
                {announcement.isAssignment && (
                    <span>Due: {formattedDueDate}</span>
                )}
            </div>
        </Card>
    );
}
