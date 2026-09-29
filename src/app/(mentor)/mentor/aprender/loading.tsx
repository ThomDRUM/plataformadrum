import { Skeleton } from "@/components/ui/skeleton";

export default function MentorAprenderLoading() {
  return (
    <div className="max-w-2xl">
      <Skeleton className="h-9 w-72 mb-6" />
      <Skeleton className="h-8 w-full max-w-md mb-6" />

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
    </div>
  );
}
