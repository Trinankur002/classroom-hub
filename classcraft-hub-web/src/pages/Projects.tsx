import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  BookOpen, 
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Circle
} from "lucide-react";
import { useProjectStore, useClassroomStore, useTaskStore, useAuthStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, addDays } from "date-fns";

export default function Projects() {
  const { projects, addProject } = useProjectStore();
  const { classrooms } = useClassroomStore();
  const { tasks } = useTaskStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    classroomId: "",
    dueDate: "",
  });

  const userRole = user?.role || 'student';
  const userId = user?.id || '';

  // Filter projects based on user role
  const userProjects = userRole === 'teacher' 
    ? projects.filter(p => p.teacherId === userId)
    : projects.filter(p => {
        const classroom = classrooms.find(c => c.id === p.classroomId);
        return classroom?.students.includes(userId);
      });

  // Get project statistics
  const getProjectStats = (project: any) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const now = new Date();
    const dueDate = new Date(project.dueDate);
    const isOverdue = isAfter(now, dueDate);
    const isDueSoon = isBefore(now, addDays(dueDate, -3)) && isAfter(addDays(dueDate, -3), now);
    
    return {
      progress,
      totalTasks,
      completedTasks,
      isOverdue,
      isDueSoon,
      status: isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : 'active'
    };
  };

  // Filter projects
  const filteredProjects = userProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'all') return true;
    
    const stats = getProjectStats(project);
    return activeTab === stats.status;
  });

  const handleCreateProject = () => {
    if (!newProject.title || !newProject.classroomId || !newProject.dueDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields."
      });
      return;
    }

    const project = {
      id: Date.now().toString(),
      ...newProject,
      teacherId: userId,
      dueDate: new Date(newProject.dueDate),
      createdAt: new Date(),
      tasks: [],
    };

    addProject(project);
    setNewProject({ title: "", description: "", classroomId: "", dueDate: "" });
    setIsCreateOpen(false);
    toast({
      title: "Project Created",
      description: `${project.title} has been created successfully.`
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'due-soon':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Circle className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'due-soon':
        return <Badge className="bg-warning text-warning-foreground">Due Soon</Badge>;
      default:
        return <Badge variant="secondary">Active</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'teacher' 
              ? "Manage assignments and track student progress"
              : "View your assignments and track your progress"
            }
          </p>
        </div>
        
        {userRole === 'teacher' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="Calculus Problem Set"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classroom">Classroom *</Label>
                  <Select 
                    value={newProject.classroomId} 
                    onValueChange={(value) => setNewProject({ ...newProject, classroomId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms
                        .filter(c => c.teacherId === userId)
                        .map((classroom) => (
                          <SelectItem key={classroom.id} value={classroom.id}>
                            {classroom.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newProject.dueDate}
                    onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Project description..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateProject} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="due-soon">Due Soon</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">No Projects Found</h3>
                  <p className="text-muted-foreground">
                    {userRole === 'teacher' 
                      ? "Create your first project to assign work to students."
                      : "No projects assigned yet. Check back later!"
                    }
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const stats = getProjectStats(project);
                const classroom = classrooms.find(c => c.id === project.classroomId);
                
                return (
                  <Card key={project.id} className="hover:shadow-hover transition-all duration-200 group">
                    <CardHeader className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(stats.status)}
                            <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                              {project.title}
                            </CardTitle>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(stats.status)}
                            {classroom && (
                              <Badge variant="outline">{classroom.name}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{Math.round(stats.progress)}%</span>
                        </div>
                        <Progress value={stats.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{stats.completedTasks} of {stats.totalTasks} tasks completed</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description || "No description available."}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Due {format(new Date(project.dueDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{classroom?.students.length || 0}</span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link to={`/projects/${project.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}