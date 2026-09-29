import { Skeleton } from "@/components/ui/skeleton";

/**
 * Espelha o layout das páginas de leitura de tópico (overview, repertório e
 * exercício), tanto do aluno quanto do mentor: sidebar sticky de tópicos + conteúdo.
 * Usado pelos `loading.tsx` dessas rotas para evitar layout shift.
 */
export function TopicPageSkeleton({ withTrailTabs = false }: { withTrailTabs?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-6 xl:flex-row xl:gap-10">
      <aside className="w-full min-w-0 shrink-0 xl:w-64">
        <div className="flex max-h-96 flex-col rounded-lg border border-border bg-card sm:max-h-[32rem] xl:sticky xl:top-10 xl:max-h-[calc(100svh-5rem)]">
          <div className="px-5 py-6 border-b border-border space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          <nav className="min-h-0 flex-1 px-3 py-4 space-y-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-border">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </aside>

      <div className="w-full min-w-0 max-w-4xl flex-1">
        {withTrailTabs && <Skeleton className="h-9 w-72 mb-6" />}
        <Skeleton className="h-8 w-full max-w-md mb-6" />

        <Skeleton className="h-6 w-3/4" />

        <div className="mt-6 space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>

        <div className="mt-6 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    </div>
  );
}
