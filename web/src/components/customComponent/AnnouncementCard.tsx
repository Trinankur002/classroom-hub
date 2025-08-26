import { Card } from "@/components/ui/card";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import FilePreview from "./FilePreview";

interface Props {
    announcement: IClassroomAnnouncement;
}

export default function AnnouncementCard({ announcement }: Props) {
    return (
        <Card className="p-4 space-y-3">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold">{announcement.name}</h3>
                <p className="text-sm text-muted-foreground">{announcement.description}</p>
            </div>

            {/* Files */}
            <FilePreview files={announcement.files} />

            {/* Footer (extra info) */}
            <div className="text-xs text-muted-foreground flex justify-between">
                <span>By {announcement.teacher.name}</span>
                {announcement.isAssignment && (
                    <span>Due: {announcement.dueDate ?? "No due date"}</span>
                )}
            </div>
        </Card>
    );
}
