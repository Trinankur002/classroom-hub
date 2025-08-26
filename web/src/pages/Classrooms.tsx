import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useClassroomStore, useAuthStore } from "@/lib/store";
import ClassroomButton from "@/components/customComponent/ClassroomButton";
import ClassroomCard from "@/components/customComponent/ClassroomCard";
import ClassroomService from '@/services/classroomService';
import { IClassroom } from "@/types/classroom";
import { toast } from "@/hooks/use-toast";
import ClassroomCardSkeleton from "@/components/customComponent/ClassroomCardSkeleton";


export default function Classrooms() {

  const navigate = useNavigate();
  const [isloading, setIsLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    navigate("/");
  }
  const userRole = user.role.toString().toLowerCase()

  const [classrooms, setClassrooms] = useState<IClassroom[]>([])
  const [searchTerm, setSearchTerm] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await ClassroomService.getAllClassrooms();
      setClassrooms(data);
      if (error) {
        toast({
          title: "Failed to load classrooms",
          description: error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    load();
  }, []);

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

        <ClassroomButton userRole={userRole} onClassroomChange={load} />
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
      {!isloading && classrooms.length === 0 ? (
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
            {isloading && (Array.from({ length: 6 }).map((_, i) => (
              <ClassroomCardSkeleton key={i} />
            )))}
            {!isloading && classrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} userRole={userRole} />
          ))}
        </div>
      )}
    </div>
  );
}