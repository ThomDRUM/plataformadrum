interface RepertoireItemData {
  id: string;
  title: string;
  content_type: string;
  youtube_url: string | null;
  content_html: string | null;
}

export function ReadOnlyRepertoireBlock({ item }: { item: RepertoireItemData | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
        Repertório
      </p>

      {!item && <p className="text-sm text-muted-foreground/60">Conteúdo não disponível.</p>}

      {item?.content_type === "video" && item.youtube_url && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
          <iframe
            src={item.youtube_url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {item?.content_type === "text" && (
        item.content_html ? (
          <div
            className="tiptap-content text-foreground/80"
            dangerouslySetInnerHTML={{ __html: item.content_html }}
          />
        ) : (
          <p className="text-sm text-muted-foreground/60">Conteúdo não disponível.</p>
        )
      )}
    </div>
  );
}
