import { Users, BookOpen, MessageCircle, TrendingUp } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClassroomButton from "@/components/customComponent/ClassroomButton";

export default function Dashboard() {
  // TODO: Get actual user role from auth context
  const userRole = "teacher"; // Mock data

  const stats = {
    teacher: [
      {
        title: "Active Classrooms",
        value: 3,
        icon: <Users className="h-4 w-4" />,
        description: "2 new students this week",
        trend: { value: 12, label: "from last month" }
      },
      {
        title: "Total Projects",
        value: 12,
        icon: <BookOpen className="h-4 w-4" />,
        description: "5 due this week",
        trend: { value: 8, label: "from last month" }
      },
      {
        title: "Messages Today",
        value: 24,
        icon: <MessageCircle className="h-4 w-4" />,
        description: "Across all classrooms"
      },
      {
        title: "Completion Rate",
        value: "89%",
        icon: <TrendingUp className="h-4 w-4" />,
        description: "Average project completion",
        trend: { value: 5, label: "from last month" }
      }
    ],
    student: [
      {
        title: "Enrolled Classes",
        value: 5,
        icon: <Users className="h-4 w-4" />,
        description: "2 new assignments today"
      },
      {
        title: "Pending Tasks",
        value: 8,
        icon: <BookOpen className="h-4 w-4" />,
        description: "3 due this week",
        trend: { value: -2, label: "from last week" }
      },
      {
        title: "Unread Messages",
        value: 3,
        icon: <MessageCircle className="h-4 w-4" />,
        description: "From class chats"
      },
      {
        title: "Grade Average",
        value: "92%",
        icon: <TrendingUp className="h-4 w-4" />,
        description: "Across all subjects",
        trend: { value: 3, label: "from last month" }
      }
    ]
  };

  const currentStats = stats[userRole as keyof typeof stats] || stats.student;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Good morning, John! 👋
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentStats.map((stat, index) => (
          <DashboardCard
            key={stat.title}
            {...stat}
            className="animate-slide-up"
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                action: "New message in Math Class",
                time: "2 minutes ago",
                type: "message"
              },
              {
                action: "Assignment submitted by Sarah",
                time: "1 hour ago",
                type: "submission"
              },
              {
                action: "New student joined Biology",
                time: "3 hours ago",
                type: "student"
              }
            ].map((activity, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-warning" />
              <span>Upcoming Deadlines</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: "Physics Lab Report",
                dueDate: "Tomorrow",
                className: "Physics 101",
                urgent: true
              },
              {
                title: "History Essay",
                dueDate: "Friday",
                className: "World History",
                urgent: false
              },
              {
                title: "Math Problem Set",
                dueDate: "Next Monday",
                className: "Calculus",
                urgent: false
              }
            ].map((deadline, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {deadline.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deadline.className}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${
                    deadline.urgent ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {deadline.dueDate}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}