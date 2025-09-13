import React, { useEffect, useState } from 'react'
import ClassroomAnnouncementService from '@/services/classroomAnnouncementService';
import { IClassroomUser } from '@/types/user';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface Props {
    classroomId: string;
    onBack: () => void;
}

function StudentsList(props: Props) {
    const { classroomId } = props

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const userRole = user?.role?.toString().toLowerCase();

    const [classroomUsers, setClassroomUsers] = useState<IClassroomUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadClassroomUsers = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await ClassroomAnnouncementService.getAllClassroomUsers(classroomId);
            if (error) {
                console.error("Failed to load classroom users:", error);
                toast({
                    title: "Failed to load all users in this classroom",
                    description: "Something went wrong",
                    variant: "destructive",
                });
            } else {
                setClassroomUsers(data);
            }
        } catch (error) {
            console.error("Error loading classroom users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            return;
        }
        loadClassroomUsers()
    }, [classroomId]);

    const studentsList = classroomUsers.filter(user => user.role === 'Student');

    return (
        <div>
            {/* Check if the filtered list has students to display */}
            {isLoading && (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Card className="cursor-not-allowed">
                            <CardContent className="flex items-center space-x-4 p-4">
                                <div className="flex-shrink-0">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            {!isLoading && studentsList.length > 0 && (
                <div>
                    {studentsList.map((user) => (
                        <Card key={user.id} className="p-4 mb-4">
                            {/* Container for the user info and button on larger screens */}
                            <div className="flex items-center justify-between sm:mb-0">
                                <div className="flex items-center space-x-4">
                                    {/* User Avatar */}
                                    {user.avatarUrl && (
                                        <img
                                            src={user.avatarUrl}
                                            alt={`${user.name}'s avatar`}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    )}
                                    {!user.avatarUrl && (
                                        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-muted/40">
                                            <span className="text-lg font-bold">
                                                {user.name?.charAt(0) || 'T'}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>

                                {/* This div is visible on screens larger than 'sm' */}
                                <div className="hidden sm:block">
                                    <Button variant="destructive">Remove</Button>
                                </div>
                            </div>

                            {/* Card Footer for small screens */}
                            <div className="mt-4 sm:hidden">
                                <div className="flex justify-end">
                                    <Button variant="destructive">Remove</Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            {!isLoading && studentsList.length === 0 && (
                <Card className="p-12 text-center">
                    <div className="space-y-4">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">No Students Joined Yet</h3>
                            <p className="text-muted-foreground">
                                {userRole === 'teacher'
                                    ? "No Students Joined Yet. Share Them The Classroom Code to Join"
                                    : "You are not Suppossed to see this page."
                                }
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

export default StudentsList
