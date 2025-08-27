import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import FilePreview from "@/components/customComponent/FilePreview";
import { IClassroomAnnouncement } from "@/types/classroomAnnouncement";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClassroomAnnouncementService from '@/services/classroomAnnouncementService';
import { toast } from "@/hooks/use-toast";

interface Props {
    announcementId: string;
    onBack: () => void;
}

export default function AnnouncementDetails({ announcementId, onBack }: Props) {

    const [isLoading, setIsLoading] = useState(false);
    const [announcement, setAnnouncement] = useState<IClassroomAnnouncement>();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
        navigate("/");
    }

    const load = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomAnnouncementService.getOneAnnouncement(announcementId)
            setAnnouncement(data);
            if (error) {
                toast({
                    title: "Failed to load announcement details",
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

    const formattedDueDate = announcement?.dueDate ? format(new Date(announcement.dueDate), "MMM dd, yyyy h:mm a") : null;
    const formattedUpdatedAt = announcement?.updatedAt ? format(new Date(announcement.updatedAt), "MMM dd, yyyy h:mm a") : null;
    const getInitials = (n?: string) => (n ? n.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() : "U");

    return (
        <div className="space-y-4">

            {isLoading && (
                <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-24 rounded-md" />
                            <Skeleton className="h-4 w-36 rounded-md" />
                        </div>
                    </div>

                    <Skeleton className="h-7 w-2/3" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-10/12" />

                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                </div>
            )}


            {!isLoading && announcement && (
                <div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={announcement.teacher?.avatarUrl} alt={announcement.teacher?.name} />
                                <AvatarFallback>{getInitials(announcement.teacher?.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium leading-none">{announcement.teacher?.name}</p>
                                {formattedUpdatedAt && (
                                    <p className="text-xs text-muted-foreground">Updated {formattedUpdatedAt}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={announcement.isAssignment ? "default" : "secondary"}>
                                {announcement.isAssignment ? "Assignment" : "Announcement"}
                            </Badge>
                            {announcement.isAssignment && formattedDueDate && (
                                <div className="flex items-center text-xs text-muted-foreground gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    <span>Due {formattedDueDate}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="mt-3 text-xl sm:text-2xl font-semibold">{announcement.name}</h1>
                    {announcement.description && (
                        <p className="text-sm sm:text-base text-muted-foreground mt-1 whitespace-pre-wrap">{announcement.description}</p>
                    )}

                    <Separator className="my-4" />
                    <FilePreview files={announcement.files} />

                    {announcement.comments && announcement.comments.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <h3 className="text-sm font-semibold">Comments</h3>
                            <div className="space-y-3">
                                {announcement.comments.map((c, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={c.sender?.avatarUrl} alt={c.sender?.name} />
                                            <AvatarFallback>{getInitials(c.sender?.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{c.sender?.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(c.time as any), "MMM dd, yyyy h:mm a")}
                                                </span>
                                            </div>
                                            <p className="text-sm">
                                                {c.content}
                                                {c.mentionedUser ? ` @${c.mentionedUser.name}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
