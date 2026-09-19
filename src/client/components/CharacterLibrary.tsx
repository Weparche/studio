import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, User, X } from "lucide-react";
import type { Character } from "@shared/types";
import { api } from "@/client/lib/api";
import { cn } from "@/client/lib/utils";

export interface StripItem {
  id: string;
  assetId: string;
  label: string;
  characterId?: string | null;
  url?: string;
  role?: "reference_image" | "first_frame" | "last_frame";
}

interface CharacterLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  onPick: (item: StripItem) => void;
}

export function CharacterLibrary({
  open,
  onOpenChange,
  projectId,
  onPick,
}: CharacterLibraryProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !projectId) return;
    let cancelled = false;
    setLoading(true);
    void api
      .characters(projectId)
      .then((res) => {
        if (!cancelled) setCharacters(res.characters);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const createCharacter = async () => {
    if (!projectId || !name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.createCharacter({
        projectId,
        name: name.trim(),
      });
      setCharacters((prev) => [...prev, res.character].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const pickCharacter = async (character: Character) => {
    if (!character.primary_reference_asset_id) {
      setError(`${character.name} has no primary reference image`);
      return;
    }
    try {
      const { url } = await api.assetUrl(character.primary_reference_asset_id);
      onPick({
        id: crypto.randomUUID(),
        assetId: character.primary_reference_asset_id,
        label: character.name,
        characterId: character.id,
        url,
        role: "reference_image",
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve asset");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded border border-[var(--line)] bg-[var(--panel)] p-3 outline-none">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-[13px] font-medium">Character library</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--panel-hover)]"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          {!projectId ? (
            <div className="py-8 text-center text-[12px] text-[var(--text-faint)]">
              Select a scene to load project characters
            </div>
          ) : (
            <>
              <form
                className="mb-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void createCharacter();
                }}
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="New character name"
                  className="min-w-0 flex-1 rounded border border-[var(--line)] bg-[var(--panel-raised)] px-2 py-1.5 text-[12px] outline-none focus:border-accent/50"
                />
                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="inline-flex items-center gap-1 rounded bg-accent px-2.5 py-1.5 text-[12px] font-medium text-[#1a140c] disabled:opacity-50"
                >
                  <Plus className="size-3.5" /> Add
                </button>
              </form>

              {error ? (
                <div className="mb-2 rounded border border-danger/30 bg-danger/10 px-2 py-1.5 text-[12px] text-danger">
                  {error}
                </div>
              ) : null}

              <div className="max-h-72 space-y-1 overflow-y-auto">
                {loading ? (
                  <div className="py-6 text-center text-[12px] text-[var(--text-faint)]">Loading…</div>
                ) : characters.length === 0 ? (
                  <div className="py-6 text-center text-[12px] text-[var(--text-faint)]">
                    No characters yet
                  </div>
                ) : (
                  characters.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => void pickCharacter(c)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded border border-[var(--line)] bg-[var(--panel-raised)] px-2.5 py-2 text-left hover:border-[var(--line-strong)]",
                        !c.primary_reference_asset_id && "opacity-60",
                      )}
                    >
                      <div className="flex size-8 items-center justify-center rounded bg-[var(--panel)] text-[var(--text-faint)]">
                        <User className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium">{c.name}</div>
                        <div className="truncate text-[11px] text-[var(--text-faint)]">
                          {c.primary_reference_asset_id
                            ? "Has primary reference"
                            : "No primary image — upload via assets"}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
