import { Skeleton } from "@/components/ui/skeleton";

export default function StudentLoading() {
  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <Skeleton className="h-7 w-2/3" />

        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/5" />
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Skeleton className="h-1.5 flex-1 max-w-sm rounded-full" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>

      <div className="w-full h-px bg-border" />

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
