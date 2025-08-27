import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import FilePreview from "./FilePreview";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

interface Props {
    announcement: IClassroomAnnouncement;
    onView?: () => void;
}

export default function AnnouncementCard({ announcement, onView }: Props) {
    const formattedDueDate = announcement.dueDate
        ? format(new Date(announcement.dueDate), "MMM dd, yyyy h:mm a")
        : "No due date";

    return (
        <Card>
            <CardHeader>
                <CardTitle>{announcement.name}</CardTitle>
                <CardDescription>{announcement.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <FilePreview files={announcement.files} />
                {announcement.isAssignment &&
                    <div>
                        <span>Due: {formattedDueDate}</span>
                    </div>
                }
            </CardContent>
            <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                <span>By {announcement.teacher.name}</span>
                <div className="flex items-center gap-2">
                    {
                        // announcement.isAssignment &&
                        <Button variant="outline" size="default" onClick={onView}>
                            View
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    }
                </div>
            </CardFooter>
        </Card>
    );
}