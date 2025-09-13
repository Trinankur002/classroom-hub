import React, { useEffect, useState } from 'react'
import ClassroomAnnouncementService from '@/services/classroomAnnouncementService';
import ClassroomService from '@/services/classroomService';
import { IClassroomUser } from '@/types/user';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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
    const [userToRemove, setUserToRemove] = useState<IClassroomUser | null>(null);

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

    const handleRemoveStudent = async () => {
        if (userToRemove) {
            try {
                const { data, error } = await ClassroomService.removeStudentFromClassroom(userToRemove.id, classroomId);
                if (data) {
                    toast({
                        title: `Removed ${userToRemove.name} from this classroom`,
                        description: "Success",
                        variant: 'default',
                    })
                }
                if (error) { 
                    console.error("Failed to delete classroom student:", error);
                    toast({
                        title: "Failed to delete classroom student",
                        description: "Something went wrong",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error("Failed to delete classroom student:", error);
            } finally {
                setUserToRemove(null); // Clear the state
                loadClassroomUsers();
            }
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
                    {studentsList.map((student) => (
                        <Card key={student.id} className="p-4 mb-4">
                            <div className="flex items-center justify-between sm:mb-0">
                                <div className="flex items-center space-x-4">
                                    {/* User Avatar */}
                                    {student.avatarUrl && (
                                        <img
                                            src={student.avatarUrl}
                                            alt={`${student.name}'s avatar`}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    )}
                                    {!student.avatarUrl && (
                                        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-muted/40">
                                            <span className="text-lg font-bold">
                                                {student.name?.charAt(0) || 'T'}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold">{student.name}</p>
                                        <p className="text-sm text-gray-500">{student.email}</p>
                                    </div>
                                </div>

                                {/* Desktop remove button wrapped in AlertDialog */}
                                <div className="hidden sm:block">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" onClick={() => setUserToRemove(student)}>
                                                Remove
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently remove **{student.name}** from this classroom.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleRemoveStudent}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Continue
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            {/* Mobile remove button wrapped in AlertDialog */}
                            <div className="mt-4 sm:hidden">
                                <div className="flex justify-end">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" onClick={() => setUserToRemove(student)}>
                                                Remove
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently remove **{student.name}** from this classroom.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction asChild>
                                                    <Button onClick={handleRemoveStudent}
                                                        variant="destructive"
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Continue
                                                    </Button>
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
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
