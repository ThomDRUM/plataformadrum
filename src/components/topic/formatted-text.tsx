import { cn } from "@/lib/utils";

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };

function parseFormattedText(text: string): Block[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const isList = lines.every((line) => line.startsWith("- "));
      if (isList) {
        return { type: "ul", items: lines.map((line) => line.replace(/^-\s*/, "")) };
      }
      return { type: "p", text: lines.join(" ") };
    });
}

export function FormattedText({ text, className }: { text: string; className?: string }) {
  const blocks = parseFormattedText(text);

  return (
    <div className={cn("space-y-2", className)}>
      {blocks.map((block, i) =>
        block.type === "ul" ? (
          <ul key={i} className="list-disc pl-5 space-y-1">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{block.text}</p>
        )
      )}
    </div>
  );
}
