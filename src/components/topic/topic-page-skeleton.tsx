import { Skeleton } from "@/components/ui/skeleton";

/**
 * Espelha o layout das páginas de leitura de tópico (overview, repertório e
 * exercício), tanto do aluno quanto do mentor: sidebar fixa de tópicos + main.
 * Usado pelos `loading.tsx` dessas rotas para evitar layout shift.
 */
export function TopicPageSkeleton({ withTrailTabs = false }: { withTrailTabs?: boolean }) {
  return (
    <div className="-mx-10 -my-10 flex min-h-screen">
      <aside className="fixed inset-y-0 left-56 w-64 bg-card border-r border-border flex flex-col z-10">
        <div className="px-5 py-6 border-b border-border space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4">
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
      </aside>

      <main className="flex-1 ml-64 px-10 py-10 max-w-4xl">
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
      </main>
    </div>
  );
}
