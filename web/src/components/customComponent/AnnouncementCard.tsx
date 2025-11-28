// Corrected AnnouncementCard.tsx
import {
    Card,
    CardContent,
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
        <Card className="w-full overflow-hidden">
            <div className="md:grid md:grid-cols-3 md:gap-x-4">
                <div className="md:col-span-2 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onView}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{announcement.name}</CardTitle>
                        <CardDescription className="mt-1 text-sm line-clamp-2">
                            {announcement.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                        <FilePreview files={announcement.files}
                            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-3"
                            previewClassName="h-12"
                            fileInfoClassName="text-xs" />
                    </CardContent>
                </div>
                <div className="px-6 pb-4 md:p-0 md:pr-6 md:py-4 flex flex-col justify-between items-start md:items-end">
                    <div className="w-full text-left md:text-right">
                        {announcement.isAssignment && (
                            <Badge variant='noHoverDefault' className="mb-2">
                                {"Assignment"}
                            </Badge>
                        )}
                        <div className="text-xs text-muted-foreground">
                            {announcement.teacher && announcement.teacher.name &&
                                <p>By {announcement.teacher.name}</p>
                            }
                            {announcement.isAssignment &&
                                <div className="mt-1 text-sm font-semibold text-foreground">
                                    <span>Due: {formattedDueDate}</span>
                                </div>
                            }
                        </div>
                    </div>
                    <Button className="mt-3 w-full md:w-auto" variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        onView?.();
                    }}>
                        View
                        <ExternalLink className="h-3 w-3 ml-1.5" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}