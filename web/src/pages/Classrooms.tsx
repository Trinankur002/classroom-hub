import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { useClassroomStore, useAuthStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function Classrooms() {
  const { classrooms, addClassroom, joinClassroom } = useClassroomStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const [newClassroom, setNewClassroom] = useState({
    name: "",
    subject: "",
    description: "",
  });

  const userRole = user?.role || 'student';
  const userClassrooms = userRole === 'teacher' 
    ? classrooms.filter(c => c.teacherId === user?.id)
    : classrooms.filter(c => c.students.includes(user?.id || ''));

  const filteredClassrooms = userClassrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClassroom = () => {
    if (!newClassroom.name || !newClassroom.subject) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields."
      });
      return;
    }

    const classroom = {
      id: Date.now().toString(),
      ...newClassroom,
      code: Math.random().toString(36).substr(2, 6).toUpperCase(),
      teacherId: user?.id || '',
      teacherName: user?.name || '',
      students: [],
      createdAt: new Date(),
    };

    addClassroom(classroom);
    setNewClassroom({ name: "", subject: "", description: "" });
    setIsCreateOpen(false);
    toast({
      title: "Classroom Created",
      description: `${classroom.name} has been created successfully.`
    });
  };

  const handleJoinClassroom = () => {
    if (!joinCode) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a classroom code."
      });
      return;
    }

    const success = joinClassroom(joinCode, user?.id || '');
    if (success) {
      setJoinCode("");
      setIsJoinOpen(false);
      toast({
        title: "Joined Classroom",
        description: "You have successfully joined the classroom."
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid classroom code or you're already enrolled."
      });
    }
  };

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
        
        <div className="flex items-center space-x-2">
          {userRole === 'teacher' ? (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Classroom
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Classroom</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Classroom Name *</Label>
                    <Input
                      id="name"
                      placeholder="Advanced Mathematics"
                      value={newClassroom.name}
                      onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Mathematics"
                      value={newClassroom.subject}
                      onChange={(e) => setNewClassroom({ ...newClassroom, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the classroom..."
                      value={newClassroom.description}
                      onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleCreateClassroom} className="w-full">
                    Create Classroom
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Join Classroom
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Join Classroom</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode">Classroom Code</Label>
                    <Input
                      id="joinCode"
                      placeholder="Enter 6-digit code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                  <Button onClick={handleJoinClassroom} className="w-full">
                    Join Classroom
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
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
      {filteredClassrooms.length === 0 ? (
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
          {filteredClassrooms.map((classroom) => (
            <Card key={classroom.id} className="hover:shadow-hover transition-all duration-200 group">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {classroom.name}
                    </CardTitle>
                    <Badge variant="secondary">{classroom.subject}</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                
                {userRole === 'teacher' && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Code: {classroom.code}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyClassroomCode(classroom.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {classroom.description || "No description available."}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{classroom.students.length} students</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(classroom.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {classroom.teacherName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{classroom.teacherName}</span>
                  </div>
                  
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