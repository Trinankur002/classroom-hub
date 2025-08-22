import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Users,
  BookOpen,
  Settings,
  Search,
  Calendar,
  UserPlus,
  Copy,
  ExternalLink
} from "lucide-react";
// import { useClassroomStore, useAuthStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import ClassroomButton from "@/components/customComponent/ClassroomButton";
import { IClassroom } from "@/types/classroom";
import ClassroomService from '@/services/classroomService';


export default function Classrooms() {

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    navigate("/");
  }
  const userRole = user.role.toString().toLowerCase()

  const [classrooms, setClassrooms] = useState<IClassroom[]>([])
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // const userClassrooms = userRole === "teacher"
  //   ? classrooms.filter(c => c.teacher.id === user?.id)
  //   : classrooms.filter(c => c.students?.some(s => s.id === user?.id));
  // // assuming later you'll have students array with objects like { id, name }

  // const filteredClassrooms = userClassrooms.filter(classroom =>
  //   classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   classroom.description.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  useEffect(() => {
    const load = async () => {
      const data = await ClassroomService.getAllClassrooms();
      setClassrooms(data);
    };
    load();
  }, []);



  const copyClassroomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: "Classroom code copied to clipboard."
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Classrooms</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'teacher'
              ? "Manage your classrooms and students"
              : "Your enrolled classrooms and assignments"
            }
          </p>
        </div>

        <ClassroomButton userRole={userRole} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search classrooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Classrooms Grid */}
      {classrooms.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">No Classrooms Found</h3>
              <p className="text-muted-foreground">
                {userRole === 'teacher'
                  ? "Create your first classroom to get started."
                  : "Join your first classroom to begin learning."
                }
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
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
          ))}
        </div>
      )}
    </div>
  );
}