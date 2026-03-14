import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface WaitingApprovalSkeletonProps {
  classroomName: string;
  error?: string | null;
}

export function WaitingApprovalSkeleton({
  classroomName,
  error,
}: WaitingApprovalSkeletonProps) {
  return (
    <div className="h-[calc(100vh-1.5rem)] overflow-hidden rounded-[32px] border border-border/60 bg-card/50">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="min-w-0 flex items-center gap-3 overflow-hidden">
            <h1 className="truncate text-lg font-semibold">{classroomName}</h1>
            <Badge variant="secondary" className="px-3 py-1 text-xs">
              Waiting approval
            </Badge>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 p-4 pb-24 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid min-h-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-[220px] rounded-2xl" />
            <Skeleton className="h-[220px] rounded-2xl" />
            <Skeleton className="h-[220px] rounded-2xl sm:col-span-2" />
          </div>
          <aside className="hidden min-h-0 overflow-hidden rounded-[28px] border border-border/70 bg-background/70 p-3 lg:block">
            <Skeleton className="mb-3 h-8 w-2/3 rounded-lg" />
            <Skeleton className="mb-2 h-6 w-full rounded-lg" />
            <Skeleton className="mb-2 h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-5/6 rounded-lg" />
          </aside>
        </div>

        <div className="border-t border-border/60 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            Join request sent. Waiting for teacher approval...
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
