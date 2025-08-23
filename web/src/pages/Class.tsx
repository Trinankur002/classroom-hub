import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function Class() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="p-4 flex flex-row items-center space-x-6 ">
            <Link to={`/classrooms`}>
                <Button variant="outline" size="sm" className="gap-1">
                    <ArrowLeft className="h-3 w-3" />
                </Button>
            </Link>
            <h1 className="text-xl font-bold">Classroom ID: {id}</h1>
            {/* fetch data using this id */}
        </div>
    );
}