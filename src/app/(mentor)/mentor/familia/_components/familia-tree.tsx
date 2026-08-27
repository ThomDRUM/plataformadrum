"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { FamilyMember } from "@/lib/mentor/familia";

function MemberNode({
  member, selected, onSelect,
}: {
  member: FamilyMember;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-20 flex-col items-center gap-1.5 rounded-lg p-2 transition-colors",
        selected ? "bg-accent" : "hover:bg-muted/50"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2",
          member.works_in_business
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background text-foreground"
        )}
      >
        <span className="text-xs font-semibold">{member.initials || "?"}</span>
      </div>
      <div className="w-full text-center">
        <p className="truncate text-[11px] leading-tight font-medium text-foreground">{member.name}</p>
        <p className="truncate text-[10px] leading-tight text-muted-foreground">{member.family_role}</p>
        {member.business_role && (
          <p className="truncate text-[10px] leading-tight text-muted-foreground/60">{member.business_role}</p>
        )}
      </div>
    </button>
  );
}

function CoupleConnector() {
  return (
    <div className="mx-1 mb-5 flex flex-shrink-0 flex-col items-center justify-center self-center">
      <div className="h-px w-6 bg-foreground/50" />
      <div className="h-1" />
      <div className="h-px w-6 bg-foreground/50" />
    </div>
  );
}

function TreeNode({
  member, spouse, allMembers, selectedId, onSelect, onAddChild,
}: {
  member: FamilyMember;
  spouse?: FamilyMember;
  allMembers: FamilyMember[];
  selectedId: string | null;
  onSelect: (m: FamilyMember) => void;
  onAddChild: (parentId: string, gen: number) => void;
}) {
  const allChildren = allMembers
    .filter((m) => m.parent_id === member.id || (spouse && m.parent_id === spouse.id))
    .sort((a, b) => a.order_index - b.order_index);

  // De-duplicate: don't render a child twice if they appear as both member and spouse
  const childrenToRender: FamilyMember[] = [];
  const renderedChildIds = new Set<string>();
  for (const child of allChildren) {
    if (renderedChildIds.has(child.id)) continue;
    childrenToRender.push(child);
    renderedChildIds.add(child.id);
    if (child.spouse_id) renderedChildIds.add(child.spouse_id);
  }

  return (
    <div className="inline-flex flex-col items-center">
      <div className="flex items-start">
        <MemberNode member={member} selected={selectedId === member.id} onSelect={() => onSelect(member)} />
        {spouse && (
          <>
            <CoupleConnector />
            <MemberNode member={spouse} selected={selectedId === spouse.id} onSelect={() => onSelect(spouse)} />
          </>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        className="mt-1 rounded-full border-dashed text-muted-foreground/40 hover:text-foreground"
        onClick={() => onAddChild(member.id, member.generation + 1)}
        title="Adicionar filho"
      >
        <Plus />
      </Button>

      {childrenToRender.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="h-5 w-px bg-border" />
          <div className="relative flex gap-3">
            {childrenToRender.length > 1 && (
              <div className="absolute top-0 h-px bg-border" style={{ left: 40, right: 40 }} />
            )}
            {childrenToRender.map((child) => {
              const childSpouse = child.spouse_id ? allMembers.find((m) => m.id === child.spouse_id) : undefined;
              return (
                <div key={child.id} className="inline-flex flex-col items-center">
                  <div className="h-5 w-px bg-border" />
                  <TreeNode
                    member={child}
                    spouse={childSpouse}
                    allMembers={allMembers}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onAddChild={onAddChild}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FamiliaTree({
  members, selectedId, onSelect, onAddChild, onAddRoot,
}: {
  members: FamilyMember[];
  selectedId: string | null;
  onSelect: (m: FamilyMember) => void;
  onAddChild: (parentId: string, gen: number) => void;
  onAddRoot: () => void;
}) {
  // De-duplicate root rendering: skip members already shown as a spouse
  const rootsSorted = members
    .filter((m) => !m.parent_id)
    .sort((a, b) => a.order_index - b.order_index);
  const rootsToRender: FamilyMember[] = [];
  const rootRenderedIds = new Set<string>();
  for (const m of rootsSorted) {
    if (rootRenderedIds.has(m.id)) continue;
    rootsToRender.push(m);
    rootRenderedIds.add(m.id);
    if (m.spouse_id) rootRenderedIds.add(m.spouse_id);
  }

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="inline-flex min-w-full flex-col items-center py-4">
        <div className="flex items-start gap-0">
          {rootsToRender.map((root, i) => {
            const rootSpouse = root.spouse_id ? members.find((m) => m.id === root.spouse_id) : undefined;
            return (
              <div key={root.id} className="flex items-center">
                {i > 0 && <div className="h-px w-10 bg-border" style={{ marginBottom: "60px" }} />}
                <TreeNode
                  member={root}
                  spouse={rootSpouse}
                  allMembers={members}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onAddChild={onAddChild}
                />
              </div>
            );
          })}
          <div className="ml-3 flex items-center" style={{ marginBottom: "60px" }}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border-dashed text-muted-foreground/40 hover:text-foreground"
              onClick={onAddRoot}
              title="Adicionar membro raiz"
            >
              <Plus />
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full border-2 border-foreground bg-foreground" />
          <span className="text-xs text-muted-foreground">Na empresa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full border-2 border-border bg-background" />
          <span className="text-xs text-muted-foreground">Fora da empresa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="h-px w-6 bg-foreground/50" />
            <div className="h-px w-6 bg-foreground/50" />
          </div>
          <span className="text-xs text-muted-foreground">Cônjuge</span>
        </div>
      </div>
    </div>
  );
}
