import { Skeleton } from "@/components/ui/skeleton";

export default function AnnouncementCardSkeleton() {
    return (
        <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
            {/* Title */}
            <Skeleton className="h-5 w-1/3 rounded-md" />

            {/* Description (2 lines) */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
            </div>

            {/* File Previews Grid (4 placeholders) */}
            <div className="grid grid-cols-4 gap-3 pt-2">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
            </div>
        </div>
    );
}
