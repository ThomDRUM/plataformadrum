"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Unlock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setModuleUnlockDate, setForceUnlocked } from "@/lib/actions/mentor";
import { TopicRow, type TopicData } from "./topic-row";

export interface ModuleData {
  id: string;
  title: string;
  orderIndex: number;
  unlocked: boolean;
  unlockDate: string | null;
  forceUnlocked: boolean;
  topics: TopicData[];
}

interface Props {
  userId: string;
  mentorId: string;
  modules: ModuleData[];
}

function formatDateBR(iso: string | null): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function ModuleCard({ userId, mentorId, mod }: { userId: string; mentorId: string; mod: ModuleData }) {
  const [expanded, setExpanded] = useState(false);
  const [unlockDate, setUnlockDate] = useState(mod.unlockDate ?? "");
  const [forceUnlocked, setForceUnlockedLocal] = useState(mod.forceUnlocked);
  const [confirmingForce, setConfirmingForce] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const unlocked = forceUnlocked || mod.unlocked;

  const completedTopics = mod.topics.filter((t) => t.status === "completed").length;
  const moduleComplete = unlocked && mod.topics.length > 0 && completedTopics === mod.topics.length;

  async function handleDateChange(value: string) {
    setUnlockDate(value);
    await setModuleUnlockDate(userId, mod.id, value || null);
  }

  async function handleForce() {
    setForceUnlockedLocal(true);
    setConfirmingForce(false);
    await setForceUnlocked(userId, mod.id, mentorId, true);
  }

  async function handleRemoveForce() {
    setForceUnlockedLocal(false);
    await setForceUnlocked(userId, mod.id, mentorId, false);
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <button onClick={() => setExpanded((v) => !v)} className="flex-1 flex items-center gap-3 text-left">
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
          <span className="text-sm font-medium text-foreground">
            Módulo {mod.orderIndex} — {mod.title}
          </span>
        </button>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-0.5 rounded border whitespace-nowrap",
              unlocked && "border-emerald-300 text-emerald-700 bg-emerald-50",
              !unlocked && "border-border text-muted-foreground"
            )}
          >
            {unlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {unlocked ? "Liberado" : "Bloqueado"}
          </span>
          {moduleComplete && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-sky-300 text-sky-700 bg-sky-50 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3" />
              Concluído
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
          <p className="text-xs text-muted-foreground">
            {completedTopics} de {mod.topics.length} tópicos concluídos
            {unlockDate && (
              <>
                {" · "}
                {unlockDate <= today ? "Liberado em: " : "Libera em: "}
                {formatDateBR(unlockDate)}
              </>
            )}
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Data de liberação</p>
              <input
                type="date"
                value={unlockDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {forceUnlocked ? (
              <button
                onClick={handleRemoveForce}
                className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                Bloquear
              </button>
            ) : confirmingForce ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-foreground">
                  Isso vai liberar o módulo mesmo que os exercícios anteriores não tenham sido feitos. Confirmar?
                </span>
                <button onClick={handleForce} className="px-2.5 py-1 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors">
                  Confirmar
                </button>
                <button onClick={() => setConfirmingForce(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingForce(true)}
                className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                Desbloquear
              </button>
            )}
          </div>

          <div className="pt-2 space-y-1.5">
            {mod.topics.map((topic) => (
              <TopicRow key={topic.id} topic={topic} mentorId={mentorId} moduleOrderIndex={mod.orderIndex} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ModuleList({ userId, mentorId, modules }: Props) {
  return (
    <div className="space-y-3">
      {modules.map((mod) => (
        <ModuleCard key={mod.id} userId={userId} mentorId={mentorId} mod={mod} />
      ))}
    </div>
  );
}
