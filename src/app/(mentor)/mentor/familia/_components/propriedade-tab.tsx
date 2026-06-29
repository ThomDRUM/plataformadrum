"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus, Trash2, Check, Pencil } from "lucide-react";
import {
  saveAsset,
  deleteAsset,
  addAssetOwnership,
  updateAssetOwnershipPercentage,
  deleteAssetOwnership,
} from "@/lib/actions/mentor";

interface Member { id: string; name: string }
interface Asset {
  id: string; name: string; asset_type: string;
  description: string | null; order_index: number;
}
interface Ownership {
  id: string; asset_id: string;
  family_member_id: string | null; member_name: string | null;
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

function PercentageCell({ ownershipId, value, onSaved }: { ownershipId: string; value: number | null; onSaved: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? 0));
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(String(value ?? 0));
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setError(null);
    setEditing(false);
  }

  async function save() {
    const num = parseFloat(draft.replace(",", "."));
    if (isNaN(num) || num < 0 || num > 100) {
      setError("0–100");
      return;
    }
    const rounded = Math.round(num * 100) / 100;
    await updateAssetOwnershipPercentage(ownershipId, rounded);
    onSaved(rounded);
    setError(null);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={cancel}
          autoFocus
          className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); save(); }}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
        >
          <Check className="w-3 h-3" />
        </button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <button onClick={startEdit} className="group flex items-center gap-1.5 text-sm text-foreground hover:bg-muted/30 rounded-md px-1.5 -mx-1.5 py-0.5 transition-colors">
      {(value ?? 0).toFixed(1)}%
      <Pencil className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors" />
    </button>
  );
}

function OwnershipTable({
  asset, members, ownership, onChange,
}: {
  asset: Asset; members: Member[]; ownership: Ownership[];
  onChange: (next: Ownership[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const total = ownership.reduce((sum, o) => sum + (o.percentage ?? 0), 0);

  function displayName(o: Ownership): string {
    return o.member_name ?? (o.family_member_id ? memberMap.get(o.family_member_id) ?? "—" : "—");
  }

  async function handleAddParticipant() {
    if (!newName.trim()) return;
    const result = await addAssetOwnership(asset.id, newName.trim());
    if (result) {
      onChange([...ownership, { id: result.id, asset_id: asset.id, family_member_id: null, member_name: newName.trim(), percentage: 0 }]);
    }
    setNewName("");
  }

  function handlePercentageSaved(id: string, value: number) {
    onChange(ownership.map((o) => (o.id === id ? { ...o, percentage: value } : o)));
  }

  async function handleRemove(id: string) {
    await deleteAssetOwnership(id);
    onChange(ownership.filter((o) => o.id !== id));
  }

  return (
    <div className="mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="pb-1.5">Participante</th>
            <th className="pb-1.5 w-32">Participação (%)</th>
            <th className="pb-1.5 w-8" />
          </tr>
        </thead>
        <tbody>
          {ownership.map((o) => (
            <tr key={o.id} className="border-t border-border">
              <td className="py-1.5 text-foreground">{displayName(o)}</td>
              <td className="py-1.5">
                <PercentageCell
                  ownershipId={o.id}
                  value={o.percentage}
                  onSaved={(v) => handlePercentageSaved(o.id, v)}
                />
              </td>
              <td className="py-1.5">
                <button onClick={() => handleRemove(o.id)} className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        {ownership.length > 0 && (
          <tfoot>
            <tr className="border-t border-border">
              <td className="py-1.5 text-xs font-medium text-muted-foreground">Total</td>
              <td className={cn("py-1.5 text-xs font-medium tabular-nums", total > 100 ? "text-destructive" : "text-foreground")}>
                {total.toFixed(1)}%
              </td>
              <td />
            </tr>
            {total > 100 && (
              <tr>
                <td colSpan={3} className="pt-1 text-xs text-destructive">Total ultrapassa 100%</td>
              </tr>
            )}
          </tfoot>
        )}
      </table>

      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAddParticipant(); }}
          placeholder="Nome do participante"
          className="flex-1 max-w-[200px] rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
        />
        <button
          onClick={handleAddParticipant}
          disabled={!newName.trim()}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-40"
        >
          <Plus className="w-3 h-3" /> Adicionar participante
        </button>
      </div>
    </div>
  );
}

export function PropriedadeTab({ familyId, members, assets: initialAssets, ownership: initialOwnership }: Props) {
  const [assets, setAssets] = useState(initialAssets);
  const [ownership, setOwnership] = useState(initialOwnership);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", asset_type: "holding", description: "" });

  function startCreate() {
    setDraft({ name: "", asset_type: "holding", description: "" });
    setCreating(true);
  }

  async function handleSaveAsset() {
    if (!draft.name.trim()) return;
    const orderIndex = assets.length;
    const result = await saveAsset(familyId, orderIndex, draft);
    if (result) {
      setAssets((prev) => [...prev, {
        id: result.id, name: draft.name.trim(), asset_type: draft.asset_type,
        description: draft.description, order_index: orderIndex,
      }]);
    }
    setCreating(false);
  }

  async function handleDeleteAsset(id: string) {
    await deleteAsset(id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setOwnership((prev) => prev.filter((o) => o.asset_id !== id));
    setDeleteCandidate(null);
    if (openId === id) setOpenId(null);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {assets.map((asset) => {
        const isOpen = openId === asset.id;
        const assetOwnership = ownership.filter((o) => o.asset_id === asset.id);

        return (
          <div key={asset.id} className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => setOpenId(isOpen ? null : asset.id)} className="flex-1 flex items-center gap-3 text-left">
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                <span className="text-sm font-medium text-foreground">{asset.name}</span>
                <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
                  {ASSET_TYPE_LABEL[asset.asset_type] ?? asset.asset_type}
                </span>
              </button>
              <button onClick={() => setDeleteCandidate(asset.id)} className="p-1 text-muted-foreground/30 hover:text-destructive transition-colors" title="Remover">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-border">
                {asset.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">{asset.description}</p>
                )}
                <OwnershipTable
                  asset={asset}
                  members={members}
                  ownership={assetOwnership}
                  onChange={(next) =>
                    setOwnership((prev) => [...prev.filter((o) => o.asset_id !== asset.id), ...next])
                  }
                />
              </div>
            )}

            {deleteCandidate === asset.id && (
              <div className="px-4 pb-4 pt-1 border-t border-border bg-destructive/5 flex items-center justify-between gap-3">
                <p className="text-xs text-foreground">Tem certeza que quer remover este ativo?</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleDeleteAsset(asset.id)} className="text-xs px-2.5 py-1 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                    Remover
                  </button>
                  <button onClick={() => setDeleteCandidate(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {creating && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nome do ativo</p>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              autoFocus
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo</p>
            <select
              value={draft.asset_type}
              onChange={(e) => setDraft({ ...draft, asset_type: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>{ASSET_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</p>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              placeholder="Opcional"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveAsset} disabled={!draft.name.trim()} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50">
              <Check className="w-3 h-3" /> Salvar
            </button>
            <button onClick={() => setCreating(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {!creating && (
        <button onClick={startCreate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="w-3.5 h-3.5" /> Adicionar ativo
        </button>
      )}
    </div>
  );
}
