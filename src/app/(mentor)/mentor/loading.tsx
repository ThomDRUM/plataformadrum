import { Skeleton } from "@/components/ui/skeleton";

export default function MentorLoading() {
  return (
    <div className="max-w-3xl space-y-8">
      <Skeleton className="h-9 w-64" />

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
