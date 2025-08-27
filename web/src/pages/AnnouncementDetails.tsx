import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import FilePreview from "@/components/customComponent/FilePreview";
import { IClassroomAnnouncement, ICreateComment } from "@/types/classroomAnnouncement";
import { IClassroomUser } from "@/types/user";
import { CalendarDays, Send, AtSign, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ClassroomAnnouncementService from '@/services/classroomAnnouncementService';
import { toast } from "@/hooks/use-toast";

interface Props {
    announcementId: string;
    classroomId: string;
    onBack: () => void;
}

export default function AnnouncementDetails({ announcementId, classroomId, onBack }: Props) {

    const [isLoading, setIsLoading] = useState(false);
    const [announcement, setAnnouncement] = useState<IClassroomAnnouncement>();
    const [commentText, setCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [classroomUsers, setClassroomUsers] = useState<IClassroomUser[]>([]);
    const [showUserSuggestions, setShowUserSuggestions] = useState(false);
    const [mentionedUser, setMentionedUser] = useState<IClassroomUser | null>(null);
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
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

    useEffect(() => {
        load();
        loadClassroomUsers();
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
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                                        <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                                    </Avatar>
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
                                            
                                            {/* User Suggestions Dropdown */}
                                            {showUserSuggestions && classroomUsers.length > 0 && (
                                                <Card className="absolute top-full left-0 right-0 mt-1 z-10 max-h-40 overflow-y-auto">
                                                    <div className="p-2">
                                                        <p className="text-xs text-muted-foreground mb-2">Mention someone:</p>
                                                        {classroomUsers.map((classroomUser) => (
                                                            <button
                                                                key={classroomUser.id}
                                                                onClick={() => handleUserMention(classroomUser)}
                                                                className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md text-left"
                                                            >
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={classroomUser.avatarUrl || undefined} alt={classroomUser.name} />
                                                                    <AvatarFallback className="text-xs">{getInitials(classroomUser.name)}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="text-sm font-medium">{classroomUser.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{classroomUser.role}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </Card>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowUserSuggestions(!showUserSuggestions)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    <AtSign className="h-4 w-4" />
                                                    <span className="text-xs">Mention</span>
                                                </Button>
                                                {mentionedUser && (
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-accent rounded-md">
                                                        <span className="text-xs">Mentioning:</span>
                                                        <span className="text-xs font-medium">{mentionedUser.name}</span>
                                                        <button
                                                            onClick={() => setMentionedUser(null)}
                                                            className="text-xs text-muted-foreground hover:text-foreground ml-1"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Ctrl+Enter to send</span>
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
                                                    <span>Send</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
