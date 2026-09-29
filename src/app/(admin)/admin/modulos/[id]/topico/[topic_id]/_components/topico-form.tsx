"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTopic, type TopicInput } from "@/lib/actions/admin/content";
import { Field, TextField, TextAreaField, FormError } from "@/components/admin/form-fields";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { SaveBar } from "./save-bar";

interface Props {
  topicId: string;
  moduleId: string;
  initial: {
    title: string;
    learning_objective: string | null;
    why: string | null;
  };
}

export function TopicoForm({ topicId, moduleId, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const input: TopicInput = {
      title: String(form.get("title") ?? "").trim(),
      learningObjective: String(form.get("learning_objective") ?? ""),
      why: String(form.get("why") ?? ""),
    };

    startTransition(async () => {
      const result = await updateTopic(topicId, moduleId, input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDirty(false);
      toast.success("Tópico atualizado.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} onChange={() => setDirty(true)}>
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Dados do tópico</FrameTitle>
          <FrameDescription>
            Título e textos que o mentorado vê ao abrir o tópico.
          </FrameDescription>
        </FrameHeader>

        <FramePanel>
          <div className="space-y-4">
            <FormError message={error} />

            <Field label="Título">
              <TextField name="title" defaultValue={initial.title} required minLength={2} />
            </Field>

            <Field label="O que você vai aprender">
              <TextAreaField
                name="learning_objective"
                defaultValue={initial.learning_objective ?? ""}
                rows={3}
              />
            </Field>

            <Field label="Por quê">
              <TextAreaField name="why" defaultValue={initial.why ?? ""} rows={3} />
            </Field>
          </div>
        </FramePanel>

        <FrameFooter>
          <SaveBar label="Salvar tópico" type="submit" isPending={isPending} dirty={dirty} />
        </FrameFooter>
      </Frame>
    </form>
  );
}
