import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import FilePreview from "./FilePreview";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Badge } from "../ui/badge";

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
                <CardDescription>
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2">
                        <p>{announcement.description}</p>

                        {announcement.isAssignment && <Badge variant='default'>
                            {"Assignment"}
                        </Badge>}
                    </div>
                    <FilePreview files={announcement.files}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3"
                        previewClassName="h-12"
                        fileInfoClassName="" />
                    {announcement.isAssignment &&
                        <div className="mt-3 text-lg">
                            <span>Due: {formattedDueDate}</span>
                        </div>
                    }
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                        <span>By {announcement.teacher.name}</span>
                        <div className="flex items-center gap-2">
                            {
                                <Button variant="outline" size="default" onClick={onView}>
                                    View
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            }
                        </div>
                    </div>
                </CardDescription>
            </CardHeader>
        </Card>
    );
}