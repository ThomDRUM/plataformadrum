"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface RepertoireItemData {
  id: string;
  title: string;
  content_type: string;
  youtube_url: string | null;
  content_html: string | null;
}

interface Props {
  userId: string;
  topicId: string;
  item: RepertoireItemData | null;
  viewed: boolean;
  hasExercise: boolean;
  onAdvance: () => void;
}

export function RepertoireBlock({ userId, topicId, item, viewed, hasExercise, onAdvance }: Props) {
  const markedRef = useRef(viewed);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleAdvanceClick() {
    setSaving(true);
    if (!markedRef.current) {
      markedRef.current = true;
      const supabase = createClient();
      await supabase.from("user_topic_progress").upsert(
        {
          user_id: userId,
          topic_id: topicId,
          repertoire_viewed: true,
          exercise_completed: hasExercise ? undefined : true,
          completed_at: hasExercise ? undefined : new Date().toISOString(),
        },
        { onConflict: "user_id,topic_id" }
      );
    }
    setSaving(false);
    onAdvance();
  }

  function handlePlayClick() {
    setOverlayVisible(false);
  }

  if (!item) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
          Repertório
        </p>
        <p className="text-sm text-muted-foreground/60">Conteúdo em breve.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
        Repertório
      </p>

      {item.content_type === "video" && item.youtube_url && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
          <iframe
            src={item.youtube_url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {overlayVisible && (
            <button
              type="button"
              onClick={handlePlayClick}
              className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors"
              aria-label="Reproduzir vídeo"
            >
              <span className="w-14 h-14 rounded-full bg-background/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-foreground" fill="currentColor" />
              </span>
            </button>
          )}
        </div>
      )}

      {item.content_type === "text" && (
        item.content_html ? (
          // `tiptap-content` é o que dá estilo a título, lista, citação e
          // imagem — sem ela o HTML do editor sai sem hierarquia nenhuma,
          // porque o preflight do Tailwind zera listas e headings.
          <div
            className="tiptap-content text-base text-foreground/80"
            dangerouslySetInnerHTML={{ __html: item.content_html }}
          />
        ) : (
          <p className="text-sm text-muted-foreground/60">Conteúdo em breve.</p>
        )
      )}

      {!viewed && (
        <div className="mt-5">
          <button
            type="button"
            onClick={handleAdvanceClick}
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}
