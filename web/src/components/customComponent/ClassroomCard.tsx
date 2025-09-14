import { IClassroom } from '@/types/classroom';
import {
    Calendar,
    Copy,
    ExternalLink,
    Settings,
    Users
} from "lucide-react";
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import ClassroomService from '@/services/classroomService';

interface Props {
    classroom: IClassroom
    userRole: string
    onLeaveClassroom: () => void
}

function ClassroomCard(props: Props) {
    const { toast } = useToast();

    const copyClassroomCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({
            title: "Code Copied",
            description: "Classroom code copied to clipboard."
        });
    };

    const deleteClassroom = async () => {
        try {
            const { data, error } = await ClassroomService.deleteClassroom(classroom.id)
            if (error) {
                console.error(`Failed to delete ${classroom.name}`, error);
                toast({
                    title: `Failed to delete ${classroom.name}`,
                    description: "Something went wrong",
                    variant: "destructive",
                });
            }
            else {
                onLeaveClassroom();
                toast({
                    title: "Classroom Deleted",
                    description: `You have Deleted ${classroom.name}.`,
                });
            }
        } catch (error) {
            console.error(`Failed to execuite deleteClassroom ${classroom.name}`, error);
        }
    }

    const leaveClassroom = async () => {
        try {
            const { data, error } = await ClassroomService.leaveClassroom(classroom.id)
            if (error) {
                console.error(`Failed to leave ${classroom.name}`, error);
                toast({
                    title: `Failed to leave ${classroom.name}`,
                    description: "Something went wrong",
                    variant: "destructive",
                });
            }
            else {
                onLeaveClassroom();
                toast({
                    title: "Classroom Left",
                    description: `You have successfully left ${classroom.name}.`,
                });
            }
        } catch (error) {
            console.error(`Failed to execuite leaveClassroom ${classroom.name}`, error);
        }
    }

    const leaveOrDeleteClassroom = async () => {
        if (userRole === 'teacher') {
            await deleteClassroom();
        } else {
            await leaveClassroom();
        }
    }

    const { classroom, userRole, onLeaveClassroom } = props

    return (
        <Card
            key={classroom.id}
            className="hover:shadow-hover transition-all duration-200 group flex flex-col min-h-[280px]"
        >
            <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {classroom.name}
                        </CardTitle>
                        <p className="text-muted-foreground">{classroom.description}</p>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className='flex items-center justify-between max-w-fit'
                        >
                            <div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant='destructive'
                                            size="sm"
                                        >
                                            {userRole === 'teacher' ? "Delete Classroom" : "Leave Classroom"}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            {userRole === 'teacher' ?
                                                (<div>
                                                    <AlertDialogTitle>
                                                        Are you absolutely sure?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanantly remove all classroom related data, students, files and assignments. This Action cannot be undone.
                                                    </AlertDialogDescription>
                                                </div>
                                                ) :
                                                (<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>)
                                            }
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={leaveOrDeleteClassroom}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Continue
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                            </div>

                        </PopoverContent>
                    </Popover>

                </div>

                {userRole === 'teacher' && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Code: {classroom.joinCode}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyClassroomCode(classroom.joinCode)}
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex flex-col flex-1">
                {userRole === 'teacher' && (
                    <div className="flex items-center justify-between text-sm mb-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{classroom.studentCount} students</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{new Date(classroom.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                {userRole === 'student' && (
                    <div className="flex items-center space-x-2 mb-4">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {classroom.teacher.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{classroom.teacher.name}</span>
                    </div>
                )}

                {/* Spacer pushes button to bottom */}
                <div className="flex-1" />

                <div className="flex justify-end">
                    <Link to={`/classrooms/${classroom.id}`}>
                        <Button variant="outline" size="default">
                            View
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>

    )
}

export default ClassroomCard
