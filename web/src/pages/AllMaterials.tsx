import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MaterialTab = "assignments" | "notes";

export default function AllMaterials() {
    const navigate = useNavigate();
    const location = useLocation();

    const activeTab = useMemo<MaterialTab>(() => {
        return location.pathname.includes("/allmaterials/notes") ? "notes" : "assignments";
    }, [location.pathname]);

    const handleTabChange = (value: string) => {
        if (value === "assignments") {
            navigate("/allmaterials/assignments");
            return;
        }
        navigate("/allmaterials/notes");
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 mt-3">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold">All Materials</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Access all classroom assignments and notes in one place.
                </p>
            </div>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assignments" className="w-full">
                        Assignments
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="w-full">
                        Notes
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="mt-4">
                <Outlet />
            </div>
        </div>
    );
}
