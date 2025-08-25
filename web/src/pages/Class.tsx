import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Projects from "./Projects";
import ClassDetails from "./ClassDetails";
import { useState } from "react";

export default function Class() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        navigate("/");
    }
    const userRole = user.role.toString().toLowerCase()
    const { id } = useParams<{ id: string }>();

    const [activeTab, setActiveTab] = useState("class");

    return (
        <div>
            <div className="p-4 flex flex-row items-center space-x-6">
                <Link to={`/classrooms`}>
                    <Button variant="outline" size="sm" className="gap-1">
                        <ArrowLeft className="h-3 w-3" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold">Classroom ID: {id}</h1>
                {/* fetch data using this id */}
            </div>

            <div className="w-full max-w-7xl mx-auto space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className={`w-full grid ${userRole === 'teacher' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <TabsTrigger value="class">Class</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        {userRole === 'teacher' && <TabsTrigger value="students">Students</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="class"><ClassDetails /></TabsContent>
                    <TabsContent value="projects"><Projects /></TabsContent>
                    {userRole === 'teacher' && <TabsContent value="students">List of students</TabsContent>}
                </Tabs>
            </div>
        </div>
    );
}