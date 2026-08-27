"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, Plus, Trash2, Check, Pencil } from "lucide-react";
import { Frame, FrameHeader, FrameTitle, FrameDescription, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from "@/components/ui/table";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  saveAsset,
  updateAsset,
  deleteAsset,
  addAssetOwnership,
  updateAssetOwnershipPercentage,
  deleteAssetOwnership,
} from "@/lib/actions/mentor";

interface Member {
  id: string;
  name: string;
}
interface Asset {
  id: string;
  name: string;
  asset_type: string;
  description: string | null;
  order_index: number;
}
interface Ownership {
  id: string;
  asset_id: string;
  family_member_id: string | null;
  member_name: string | null;
  percentage: number | null;
}

interface Props {
  familyId: string;
  members: Member[];
  assets: Asset[];
  ownership: Ownership[];
}

const ASSET_TYPE_LABEL: Record<string, string> = {
  holding: "Holding",
  imovel: "Imóvel",
  empresa: "Empresa",
  investimento: "Investimento",
  outro: "Outro",
};

const ASSET_TYPES = Object.keys(ASSET_TYPE_LABEL);

const SELECT_CLASS =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none " +
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// ── Ownership table (dentro do Sheet de gerenciar) ──────────────────────────────

function PercentageCell({
  ownershipId, value, onSaved,
}: {
  ownershipId: string;
  value: number | null;
  onSaved: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setDraft(String(value ?? 0));
    setError(null);
    setEditing(true);
  }
  function cancel() {
    setError(null);
    setEditing(false);
  }
  function save() {
    const num = parseFloat(draft.replace(",", "."));
    if (isNaN(num) || num < 0 || num > 100) {
      setError("0–100");
      return;
    }
    const rounded = Math.round(num * 100) / 100;
    setEditing(false);
    startTransition(async () => {
      const result = await updateAssetOwnershipPercentage(ownershipId, rounded);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onSaved(rounded);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={cancel}
          autoFocus
          className="w-16"
        />
        <Button type="button" size="icon-xs" disabled={isPending} onMouseDown={(e) => { e.preventDefault(); save(); }}>
          <Check />
        </Button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="group -mx-1.5 gap-1.5 px-1.5 text-foreground"
      onClick={startEdit}
    >
      {(value ?? 0).toFixed(1)}%
      <Pencil className="text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
    </Button>
  );
}

function OwnershipTable({
  asset, members, ownership, onChange,
}: {
  asset: Asset;
  members: Member[];
  ownership: Ownership[];
  onChange: (next: Ownership[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const total = ownership.reduce((sum, o) => sum + (o.percentage ?? 0), 0);

  function displayName(o: Ownership): string {
    return o.member_name ?? (o.family_member_id ? (memberMap.get(o.family_member_id) ?? "—") : "—");
  }

  function handleAddParticipant() {
    if (!newName.trim()) return;
    const name = newName.trim();
    setNewName("");
    startTransition(async () => {
      const result = await addAssetOwnership(asset.id, name);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange([
        ...ownership,
        { id: result.data.id, asset_id: asset.id, family_member_id: null, member_name: name, percentage: 0 },
      ]);
    });
  }

  function handlePercentageSaved(id: string, value: number) {
    onChange(ownership.map((o) => (o.id === id ? { ...o, percentage: value } : o)));
  }

  function handleRemove(id: string) {
    const prevList = ownership;
    onChange(ownership.filter((o) => o.id !== id));
    startTransition(async () => {
      const result = await deleteAssetOwnership(id);
      if (!result.ok) {
        onChange(prevList);
        toast.error(result.error);
      }
    });
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participante</TableHead>
            <TableHead className="w-32">Participação (%)</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ownership.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="text-foreground">{displayName(o)}</TableCell>
              <TableCell>
                <PercentageCell ownershipId={o.id} value={o.percentage} onSaved={(v) => handlePercentageSaved(o.id, v)} />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground/40 hover:text-destructive"
                  onClick={() => handleRemove(o.id)}
                >
                  <Trash2 />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {ownership.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="text-xs font-medium text-muted-foreground">Total</TableCell>
              <TableCell className={cn("text-xs font-medium tabular-nums", total > 100 ? "text-destructive" : "text-foreground")}>
                {total.toFixed(1)}%
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        )}
      </Table>
      {total > 100 && <p className="mt-1 text-xs text-destructive">Total ultrapassa 100%</p>}

      <div className="mt-2 flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddParticipant();
          }}
          placeholder="Nome do participante"
          className="max-w-[200px]"
        />
        <Button type="button" size="sm" disabled={!newName.trim() || isPending} onClick={handleAddParticipant}>
          <Plus /> Adicionar participante
        </Button>
      </div>
    </div>
  );
}

// ── Novo ativo ───────────────────────────────────────────────────────────────

function NovoAtivoSheet({
  familyId, orderIndex, onCreated,
}: {
  familyId: string;
  orderIndex: number;
  onCreated: (asset: Asset) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", asset_type: "holding", description: "" });
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!draft.name.trim()) return;
    startTransition(async () => {
      const result = await saveAsset(familyId, orderIndex, draft);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onCreated({
        id: result.data.id,
        name: draft.name.trim(),
        asset_type: draft.asset_type,
        description: draft.description,
        order_index: orderIndex,
      });
      toast.success("Ativo criado.");
      setDraft({ name: "", asset_type: "holding", description: "" });
      setOpen(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="lg" />}>
        <Plus /> Novo ativo
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Novo ativo</SheetTitle>
          <SheetDescription>Cadastre um bem ou empresa do patrimônio da família.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome do ativo</p>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Tipo</p>
            <select
              value={draft.asset_type}
              onChange={(e) => setDraft({ ...draft, asset_type: e.target.value })}
              className={SELECT_CLASS}
            >
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ASSET_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Descrição</p>
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              placeholder="Opcional"
            />
          </div>
        </div>
        <div className="border-t border-border p-4">
          <Button type="button" disabled={!draft.name.trim() || isPending} onClick={handleSave} className="w-full">
            <Check /> Criar ativo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Gerenciar ativo (editar + participação) ─────────────────────────────────

function EditarAtivoForm({
  asset, members, ownership, onSaved, onOwnershipChange,
}: {
  asset: Asset;
  members: Member[];
  ownership: Ownership[];
  onSaved: (patch: Partial<Asset>) => void;
  onOwnershipChange: (next: Ownership[]) => void;
}) {
  const [draft, setDraft] = useState({ name: asset.name, asset_type: asset.asset_type, description: asset.description ?? "" });
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!draft.name.trim()) return;
    startTransition(async () => {
      const result = await updateAsset(asset.id, {
        name: draft.name.trim(),
        asset_type: draft.asset_type,
        description: draft.description,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onSaved({ name: draft.name.trim(), asset_type: draft.asset_type, description: draft.description });
      toast.success("Ativo atualizado.");
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{asset.name}</SheetTitle>
        <SheetDescription>Dados do ativo e participação societária.</SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome do ativo</p>
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Tipo</p>
          <select
            value={draft.asset_type}
            onChange={(e) => setDraft({ ...draft, asset_type: e.target.value })}
            className={SELECT_CLASS}
          >
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {ASSET_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Descrição</p>
          <Textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            placeholder="Opcional"
          />
        </div>
        <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
          <Check /> Salvar alterações
        </Button>

        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Participação societária</p>
          <OwnershipTable asset={asset} members={members} ownership={ownership} onChange={onOwnershipChange} />
        </div>
      </div>
    </>
  );
}

function EditarAtivoSheet({
  asset, members, ownership, open, onOpenChange, onSaved, onOwnershipChange,
}: {
  asset: Asset | null;
  members: Member[];
  ownership: Ownership[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (patch: Partial<Asset>) => void;
  onOwnershipChange: (next: Ownership[]) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {asset && (
          <EditarAtivoForm
            key={asset.id}
            asset={asset}
            members={members}
            ownership={ownership}
            onSaved={onSaved}
            onOwnershipChange={onOwnershipChange}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Ações por linha ───────────────────────────────────────────────────────────

function AtivoAcoes({
  asset, onEdit, onDeleted,
}: {
  asset: Asset;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAsset(asset.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onDeleted();
      toast.success("Ativo removido.");
      setConfirmingDelete(false);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label={`Ações de ${asset.name}`}>
          <EllipsisVerticalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon aria-hidden="true" />
              Gerenciar
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmingDelete(true)}>
            <TrashIcon aria-hidden="true" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {asset.name}?</DialogTitle>
            <DialogDescription>
              A participação societária cadastrada para este ativo também é removida. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isPending} />}>Cancelar</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PropriedadeTab({ familyId, members, assets: initialAssets, ownership: initialOwnership }: Props) {
  const [assets, setAssets] = useState(initialAssets);
  const [ownership, setOwnership] = useState(initialOwnership);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  function handleCreated(asset: Asset) {
    setAssets((prev) => [...prev, asset]);
  }

  function handleSaved(id: string, patch: Partial<Asset>) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    setEditingAsset((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }

  function handleDeleted(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setOwnership((prev) => prev.filter((o) => o.asset_id !== id));
  }

  function handleOwnershipChange(assetId: string, next: Ownership[]) {
    setOwnership((prev) => [...prev.filter((o) => o.asset_id !== assetId), ...next]);
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Frame spacing="xs">
        <FrameHeader className="flex-row items-center justify-between gap-4">
          <div>
            <FrameTitle>Propriedade</FrameTitle>
            <FrameDescription>Ativos e participação societária da família.</FrameDescription>
          </div>
          <NovoAtivoSheet familyId={familyId} orderIndex={assets.length} onCreated={handleCreated} />
        </FrameHeader>
        <FramePanel className="p-0!">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Participação total</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum ativo cadastrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => {
                  const total = ownership
                    .filter((o) => o.asset_id === asset.id)
                    .reduce((sum, o) => sum + (o.percentage ?? 0), 0);
                  return (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium text-foreground">{asset.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ASSET_TYPE_LABEL[asset.asset_type] ?? asset.asset_type}
                      </TableCell>
                      <TableCell className={cn("tabular-nums", total > 100 ? "text-destructive" : "text-muted-foreground")}>
                        {total.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <AtivoAcoes
                          asset={asset}
                          onEdit={() => setEditingAsset(asset)}
                          onDeleted={() => handleDeleted(asset.id)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </FramePanel>
      </Frame>

      <EditarAtivoSheet
        asset={editingAsset}
        members={members}
        ownership={editingAsset ? ownership.filter((o) => o.asset_id === editingAsset.id) : []}
        open={editingAsset !== null}
        onOpenChange={(open) => !open && setEditingAsset(null)}
        onSaved={(patch) => editingAsset && handleSaved(editingAsset.id, patch)}
        onOwnershipChange={(next) => editingAsset && handleOwnershipChange(editingAsset.id, next)}
      />
    </div>
  );
}
