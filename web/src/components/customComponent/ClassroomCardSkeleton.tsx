import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function ClassroomCardSkeleton() {
    return (
        <Card className="flex flex-col min-h-[280px]">
            <CardHeader className="space-y-3">
                <Skeleton className="h-5 w-1/3" />   {/* title */}
                <Skeleton className="h-4 w-2/3" />   {/* description */}
            </CardHeader>
            <CardContent className="flex flex-col flex-1 justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />   {/* code or teacher */}
                    <Skeleton className="h-4 w-1/3" />   {/* students/date */}
                </div>
                <div className="flex justify-end">
                    <Skeleton className="h-8 w-20 rounded-md" />   {/* button */}
                </div>
            </CardContent>
        </Card>
    )
}

export default ClassroomCardSkeleton