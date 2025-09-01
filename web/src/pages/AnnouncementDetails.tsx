import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import FilePreview from "@/components/customComponent/FilePreview";
import { IClassroomAnnouncement, ICreateComment } from "@/types/classroomAnnouncement";
import { IClassroomUser } from "@/types/user";
import { CalendarDays, Send, AtSign, MessageCircle, X } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ClassroomAnnouncementService from '@/services/classroomAnnouncementService';
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Props {
    announcementId: string;
    classroomId: string;
    onBack: () => void;
    onDeleteSuccess: () => void;
}

export default function AnnouncementDetails({ announcementId, classroomId, onBack, onDeleteSuccess }: Props) {

    const [isLoading, setIsLoading] = useState(false);
    const [announcement, setAnnouncement] = useState<IClassroomAnnouncement | null>(null);

    const [commentText, setCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [classroomUsers, setClassroomUsers] = useState<IClassroomUser[]>([]);
    const [showUserSuggestions, setShowUserSuggestions] = useState(false);
    const [mentionedUser, setMentionedUser] = useState<IClassroomUser | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const load = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await ClassroomAnnouncementService.getOneAnnouncement(announcementId)
            setAnnouncement(data || null);

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

    const loadClassroomUsers = async () => {
        try {
            const { data, error } = await ClassroomAnnouncementService.getAllClassroomUsers(classroomId);
            if (error) {
                console.error("Failed to load classroom users:", error);
            } else {
                setClassroomUsers(data);
            }
        } catch (error) {
            console.error("Error loading classroom users:", error);
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) return;

        setIsSubmittingComment(true);
        try {
            const commentData: ICreateComment = {
                announcementId,
                content: commentText.trim(),
                time: new Date(),
                mentionedUserId: mentionedUser?.id
            };

            const { data, error } = await ClassroomAnnouncementService.addCommentToAnnouncement(commentData);

            if (error) {
                toast({
                    title: "Failed to add comment",
                    description: error,
                    variant: "destructive",
                });
            } else if (data) {
                setAnnouncement(prev => prev ? { ...prev, comments: data.comments } : data);
                setCommentText("");
                setMentionedUser(null);
                setShowUserSuggestions(false);
                toast({
                    title: "Comment added successfully",
                    variant: "default",
                });
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            toast({
                title: "Failed to add comment",
                description: "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setCommentText(value);
    };

    const handleUserMention = (selectedUser: IClassroomUser) => {
        setMentionedUser(selectedUser);
        setShowUserSuggestions(false);
    };

    const toggleMentionDropdown = () => {
        setShowUserSuggestions(!showUserSuggestions);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleCommentSubmit();
        }
    };

    const deleteAnnouncement = async (id: string) => {
        setIsDeleting(true);
        try {
            // Simulate API call for deletion
            await ClassroomAnnouncementService.deleteAnnouncement(id);
            console.log("Deleting announcement:", id);

            toast({
                title: "Announcement Deleted",
                description: "The announcement has been successfully removed.",
            });
            onBack();
            onDeleteSuccess();
        } catch (error) {
            console.error("Error deleting announcement:", error);
            toast({
                title: "Deletion Failed",
                description: "Could not delete the announcement. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    }

    useEffect(() => {
        if (!user) {
            navigate("/");
        } else {
            load();
            loadClassroomUsers();
        }
    }, [])

    if (!user) {
        return null;
    }

    const formattedDueDate = announcement?.dueDate ? format(new Date(announcement.dueDate), "MMM dd, yyyy h:mm a") : null;

    const formattedUpdatedAt = announcement?.updatedAt ? format(new Date(announcement.updatedAt), "MMM dd, yyyy h:mm a") : null;
    const getInitials = (n?: string) => (n ? n.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() : "U");

    return (
        <div className="space-y-4 px-4 sm:px-6 md:px-8 py-4">

            {isLoading && (
                <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                            <Skeleton className="h-5 w-24 rounded-md" />
                            <Skeleton className="h-4 w-36 rounded-md" />
                        </div>
                    </div>

                    <Skeleton className="h-7 w-2/3" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-10/12" />

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg hidden sm:block" />
                        <Skeleton className="h-24 w-full rounded-lg hidden lg:block" />
                    </div>
                </div>
            )}


            {!isLoading && announcement && (
                <div>
                    <div className="h-2"></div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                            <h1 className="mt-3 text-2xl sm:text-2xl font-semibold">{announcement.name}</h1>
                            {announcement.description && (
                                <p className="text-sm sm:text-base text-muted-foreground mt-1 whitespace-pre-wrap">{announcement.description}</p>
                            )}
                            <Separator className="my-4" />
                            <div className="flex items-center gap-3 my-4">
                                <div className="space-y-1 mt-1">
                                    <p className="text-md font-medium leading-none">{announcement.teacher?.name}</p>
                                    {formattedUpdatedAt && (
                                        <p className="text-xs text-muted-foreground">Updated {formattedUpdatedAt}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-3 sm:gap-6 mt-4 sm:mt-0">
                            <Badge variant={announcement.isAssignment ? "default" : "secondary"}>
                                {announcement.isAssignment ? "Assignment" : "Announcement"}
                            </Badge>
                            {announcement.isAssignment && formattedDueDate && (
                                <div className="flex items-center text-sm sm:text-xl text-muted-foreground gap-1">
                                    <CalendarDays className="h-4 w-4 sm:h-6 sm:w-6" />
                                    <span>Due {formattedDueDate}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator className="my-4" />
                    <FilePreview files={announcement.files} />

                    {/* Comments Section */}
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            <h3 className="text-sm font-semibold">
                                Comments ({announcement.comments?.length || 0})
                            </h3>
                        </div>

                        {/* Comments List */}
                        {announcement.comments && announcement.comments.length > 0 ? (
                            <div className="space-y-3">
                                {announcement.comments.map((c, idx) => (
                                    <div key={idx} className="flex gap-3 align-items-center ">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={c.sender?.avatarUrl} alt={c.sender?.name} />
                                            <AvatarFallback>{getInitials(c.sender?.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-light">{c.sender?.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(c.time as any), "MMM dd, yyyy h:mm a")}
                                                </span>
                                            </div>
                                            <p className="flex gap-2 text-sm">
                                                {c.content}
                                                <p>
                                                    {c.mentionedUser ? ` @${c.mentionedUser.name}` : ""}
                                                </p>

                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-6 text-center">
                                <div className="space-y-2">
                                    <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">No comments yet</p>
                                        <p className="text-xs text-muted-foreground">
                                            Be the first to comment on this {announcement.isAssignment ? 'assignment' : 'announcement'}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Comment Input */}
                        <div className="relative">
                            <Card className="p-4">
                                <div className="flex gap-3">
                                    <div className="flex-1 space-y-3">
                                        <div className="relative">
                                            <Textarea
                                                ref={textareaRef}
                                                placeholder="Add a comment..."
                                                value={commentText}
                                                onChange={handleTextareaChange}
                                                onKeyDown={handleKeyPress}
                                                className="min-h-[80px] resize-none"
                                                disabled={isSubmittingComment}
                                            />
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                            {/* Mention Button and Tag*/}
                                            <div className="flex flex-wrap items-center gap-2">
                                                {/* User Suggestions Dropdown */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            <AtSign className="h-4 w-4" />
                                                            <span className="text-xs ml-1">Mention</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-64" align="start">
                                                        <DropdownMenuLabel>Mention someone:</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <div className="max-h-40 overflow-y-auto">
                                                            {classroomUsers.map((classroomUser) => (
                                                                <DropdownMenuItem
                                                                    key={classroomUser.id}
                                                                    onSelect={() => handleUserMention(classroomUser)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Avatar className="h-6 w-6 mr-2">
                                                                        <AvatarImage src={classroomUser.avatarUrl || undefined} alt={classroomUser.name} />
                                                                        <AvatarFallback className="text-xs">{getInitials(classroomUser.name)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="text-sm font-medium">{classroomUser.name}</p>
                                                                        <p className="text-xs text-muted-foreground">{classroomUser.role}</p>
                                                                    </div>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </div>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                {mentionedUser && (
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                                                        <span className="text-xs">Mentioning:</span>
                                                        <span className="text-xs font-medium">{mentionedUser.name}</span>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => setMentionedUser(null)}
                                                            className="text-xs hover:text-foreground ml-1 h-4 w-4"
                                                        >
                                                            <X className="align-self-lg-center" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Send Button and Hint */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground hidden sm:inline">Ctrl+Enter to send</span>
                                                <Button
                                                    onClick={handleCommentSubmit}
                                                    disabled={!commentText.trim() || isSubmittingComment}
                                                    size="sm"
                                                >
                                                    {isSubmittingComment ? (
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                    ) : (
                                                        <Send className="h-4 w-4" />
                                                    )}
                                                    <span className="ml-2">Send</span>
                                                </Button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Delete Announcement Section */}
                    {user?.id === announcement?.teacher?.id && (
                        <div className="mt-8 flex justify-end">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">Delete Announcement</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this announcement and remove all associated data from our servers.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => deleteAnnouncement(announcementId)}
                                            disabled={isDeleting}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            {isDeleting ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                    <span>Deleting...</span>
                                                </div>
                                            ) : (
                                                "Delete"
                                            )}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
