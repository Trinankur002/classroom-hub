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

interface Props {
    classroom: IClassroom
    userRole: string
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

    const { classroom, userRole } = props

    return (
        <Card key={classroom.id} className="hover:shadow-hover transition-all duration-200 group">
            <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {classroom.name}
                        </CardTitle>
                        <p className="text-muted-foreground">{classroom.description}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                    </Button>
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

            <CardContent className="space-y-4">

                {userRole === 'teacher' &&
                    (<div className="flex items-center justify-between text-sm">
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

                <div className="flex items-center justify-between">

                    {userRole === 'student' &&
                        (<div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {classroom.teacher.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{classroom.teacher.name}</span>
                        </div>
                        )}

                    <Link to={`/classrooms/${classroom.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View
                        </Button>
                    </Link>

                </div>
            </CardContent>
        </Card>
    )
}

export default ClassroomCard
