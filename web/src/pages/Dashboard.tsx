import { Users, BookOpen, MessageCircle, TrendingUp } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClassroomButton from "@/components/customComponent/ClassroomButton";
import { useAuth } from "@/hooks/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import EventService from '@/services/eventService';
import { IEvent } from "@/types/event";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const userRole = user.role.toString().toLowerCase();
  const [mentions, setMentions] = useState<IEvent[]>([]);
  const [assignments, setAssignments] = useState<IEvent[]>([]);
  const [doubts, setDoubts] = useState<IEvent[]>([]);

  const [mentionsLoading, setMentionsLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [doubtsLoading, setDoubtsLoading] = useState(false);

  const getMentions = useCallback(async () => {
    setMentionsLoading(true);
    try {
      const { data, error } = await EventService.getNewMentionEvents();
      if (error) {
        toast({
          title: "Failed to load recent mentions",
          description: "Something went wrong",
          variant: "destructive",
        });
        return;
      }
      setMentions(data || []);
    } catch (err) {
      console.error("getMentions error:", err);
    } finally {
      setMentionsLoading(false);
    }
  }, []);

  const getAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      const { data, error } = await EventService.getNewAssignmentEvents();
      if (error) {
        toast({
          title: "Failed to load recent assignments",
          description: "Something went wrong",
          variant: "destructive",
        });
        return;
      }
      setAssignments(data || []);
    } catch (err) {
      console.error("getAssignments error:", err);
    } finally {
      setAssignmentsLoading(false);
    }
  }, []);

  const getDoubts = useCallback(async () => {
    setDoubtsLoading(true);
    try {
      const { data, error } = await EventService.getNewDoubtsEventsForTeacher();
      if (error) {
        toast({
          title: "Failed to load recent doubts",
          description: "Something went wrong",
          variant: "destructive",
        });
        return;
      }
      setDoubts(data || []);
    } catch (err) {
      console.error("getDoubts error:", err);
    } finally {
      setDoubtsLoading(false);
    }
  }, []);

  useEffect(() => {
    getMentions();

    if (userRole === "student") {
      getAssignments();
    }

    if (userRole === "teacher") {
      getDoubts();
    }
  }, [userRole, getMentions, getAssignments, getDoubts]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {`Hello ${user.name.split(" ")[0]} 👋`}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userRole === "teacher"
              ? "Ready to inspire your students today?"
              : "Let's check your progress and assignments"
            }
          </p>
        </div>

        <ClassroomButton userRole={userRole} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher recent doubts */}
        {userRole === "teacher" && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {doubtsLoading ? (
                <Skeleton className="w-full h-6 rounded-md" />
              ) : (
                <div
                  className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {`${doubts.length} New recent doubts from students`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Student assignments */}
        {userRole === "student" && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>Assignments</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignmentsLoading ? (
                <Skeleton className="w-full h-6 rounded-md" />
              ) : (
                <div
                  className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {`${assignments.length} recent assignments`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mentions card (visible to all roles) */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Mentions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mentionsLoading ? (
              <Skeleton className="w-full h-6 rounded-md" />
            ) : (
              <div
                className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {`${mentions.length} recent mentions`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}