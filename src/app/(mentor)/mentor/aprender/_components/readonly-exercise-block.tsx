import { FormattedText } from "@/components/topic/formatted-text";

interface ExerciseData {
  id: string;
  title: string;
  instructions: string | null;
}

interface QuestionData {
  id: string;
  question_text: string;
  order_index: number;
}

export function ReadOnlyExerciseBlock({ exercise, questions }: { exercise: ExerciseData | null; questions: QuestionData[] }) {
  if (!exercise) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
          Exercício
        </p>
        <p className="text-sm text-muted-foreground/60">Conteúdo não disponível.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
        Exercício
      </p>

      <div className="border border-border rounded-lg p-5 space-y-5">
        <p className="text-xs text-muted-foreground italic">
          Visualização — estes são os exercícios que o mentorado responde
        </p>

        <div>
          <p className="text-sm font-medium text-foreground leading-snug">{exercise.title}</p>
          {exercise.instructions && (
            <FormattedText
              text={exercise.instructions}
              className="mt-1.5 text-sm text-muted-foreground leading-relaxed"
            />
          )}
        </div>

        <div className="space-y-4">
          {questions.map((q) => (
            <FormattedText
              key={q.id}
              text={q.question_text}
              className="text-sm font-medium text-foreground leading-snug"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
