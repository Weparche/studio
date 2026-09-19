import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClipboardCopy,
  Eraser,
  Film,
  Frame,
  ImagePlus,
  Images,
  Loader2,
  Sparkles,
  Type,
  Upload,
  Users,
  X,
} from "lucide-react";
import type {
  AspectRatio,
  Generation,
  GenerationMode,
  Resolution,
} from "@shared/types";
import { MIN_DURATION, MAX_DURATION, SUPPORTED_RATIOS } from "@shared/types";
import { renumberReferences } from "@shared/references";
import {
  api,
  type CreateGenerationBody,
  type PromptSnippet,
  type SceneDetail,
} from "@/client/lib/api";
import { CharacterLibrary, type StripItem } from "@/client/components/CharacterLibrary";
import { useDebouncedCallback } from "@/client/hooks/useDebounce";
import { cn, modKeyLabel } from "@/client/lib/utils";

const MODES: Array<{
  id: GenerationMode;
  label: string;
  hint: string;
  icon: typeof Type;
}> = [
  { id: "text", label: "Text", hint: "Prompt only", icon: Type },
  {
    id: "first_frame",
    label: "First frame",
    hint: "Start from an image · aspect follows the frame",
    icon: Frame,
  },
  {
    id: "first_last",
    label: "First + Last",
    hint: "Pin start and end frames",
    icon: Film,
  },
  {
    id: "references",
    label: "References",
    hint: "Character/style refs — cite @image1 in the prompt",
    icon: Images,
  },
];

const DURATION_CHIPS = [5, 10, 15, 20, 30];

const FRAME_MODES = new Set<GenerationMode>(["first_frame", "first_last"]);

export interface ComposerState {
  mode: GenerationMode;
  prompt: string;
  duration: number;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  generateAudio: boolean;
  returnLastFrame: boolean;
  firstFrame: StripItem | null;
  lastFrame: StripItem | null;
  references: StripItem[];
}

interface SceneComposerProps {
  scene: SceneDetail | null;
  onGenerated: () => void;
  restoreFrom?: Generation | null;
  continueFrom?: {
    generation: Generation;
    lastFrameAssetId: string;
  } | null;
  injectFirstFrame?: StripItem | null;
  injectReference?: StripItem | null;
  onConsumedInject?: () => void;
}

export function SceneComposer({
  scene,
  onGenerated,
  restoreFrom,
  continueFrom,
  injectFirstFrame,
  injectReference,
  onConsumedInject,
}: SceneComposerProps) {
  const [state, setState] = useState<ComposerState>(defaultState());
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<PromptSnippet[]>([]);
  const [showSnippets, setShowSnippets] = useState(false);
  const [charLibOpen, setCharLibOpen] = useState(false);
  const [customDuration, setCustomDuration] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRoleRef = useRef<"reference_image" | "first_frame" | "last_frame">(
    "reference_image",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!scene) return;
    setState({
      mode: scene.preferred_mode,
      prompt: scene.working_prompt ?? "",
      duration: scene.preferred_duration,
      resolution: scene.preferred_resolution,
      aspectRatio: scene.preferred_ratio,
      generateAudio: scene.preferred_audio,
      returnLastFrame: scene.preferred_return_last_frame,
      firstFrame: null,
      lastFrame: null,
      references: [],
    });
    setCustomDuration(!DURATION_CHIPS.includes(scene.preferred_duration));
    setError(null);
  }, [scene?.id]);

  useEffect(() => {
    if (!restoreFrom) return;
    setState((prev) => ({
      ...prev,
      mode: restoreFrom.mode,
      prompt: restoreFrom.prompt,
      duration: restoreFrom.duration,
      resolution: restoreFrom.resolution,
      aspectRatio: restoreFrom.aspect_ratio,
      generateAudio: restoreFrom.generate_audio,
      returnLastFrame: restoreFrom.return_last_frame,
      firstFrame: restoreFrom.first_frame_asset_id
        ? {
            id: crypto.randomUUID(),
            assetId: restoreFrom.first_frame_asset_id,
            label: "First frame",
            role: "first_frame",
          }
        : null,
      lastFrame: restoreFrom.last_frame_asset_id
        ? {
            id: crypto.randomUUID(),
            assetId: restoreFrom.last_frame_asset_id,
            label: "Last frame",
            role: "last_frame",
          }
        : null,
    }));
    setCustomDuration(!DURATION_CHIPS.includes(restoreFrom.duration));
    onConsumedInject?.();
  }, [restoreFrom, onConsumedInject]);

  useEffect(() => {
    if (!continueFrom) return;
    setState((prev) => ({
      ...prev,
      mode: "first_frame",
      firstFrame: {
        id: crypto.randomUUID(),
        assetId: continueFrom.lastFrameAssetId,
        label: "Continue frame",
        role: "first_frame",
      },
      lastFrame: null,
    }));
    onConsumedInject?.();
  }, [continueFrom, onConsumedInject]);

  useEffect(() => {
    if (injectFirstFrame) {
      setState((prev) => ({
        ...prev,
        mode: prev.mode === "text" ? "first_frame" : prev.mode,
        firstFrame: injectFirstFrame,
      }));
      onConsumedInject?.();
    }
  }, [injectFirstFrame, onConsumedInject]);

  useEffect(() => {
    if (injectReference) {
      setState((prev) => ({
        ...prev,
        mode: "references",
        references: [
          ...prev.references,
          { ...injectReference, role: "reference_image" },
        ],
      }));
      onConsumedInject?.();
    }
  }, [injectReference, onConsumedInject]);

  useEffect(() => {
    if (!scene?.project_id) return;
    void api.promptSnippets(scene.project_id).then((r) => setSnippets(r.snippets));
  }, [scene?.project_id]);

  const persistScene = useCallback(
    async (next: ComposerState) => {
      if (!scene) return;
      setSaving(true);
      try {
        await api.patchScene(scene.id, {
          workingPrompt: next.prompt,
          preferredMode: next.mode,
          preferredResolution: next.resolution,
          preferredDuration: next.duration,
          preferredRatio: next.aspectRatio,
          preferredAudio: next.generateAudio,
          preferredReturnLastFrame: next.returnLastFrame,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [scene],
  );

  const debouncedSave = useDebouncedCallback((next: ComposerState) => {
    void persistScene(next);
  }, 700);

  const update = (patch: Partial<ComposerState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      debouncedSave(next);
      return next;
    });
  };

  const setMode = (mode: GenerationMode) => {
    if (FRAME_MODES.has(mode)) {
      update({ mode, aspectRatio: "adaptive" });
    } else {
      update({ mode });
    }
  };

  const taggedRefs = renumberReferences(
    state.references.map((r) => ({
      id: r.id,
      assetId: r.assetId,
      label: r.label,
      characterId: r.characterId,
      role: r.role ?? "reference_image",
    })),
  );

  const generateBlockedReason = (): string | null => {
    if (state.mode === "text" && !state.prompt.trim()) {
      return "Add a prompt to generate";
    }
    if (state.mode === "first_frame" && !state.firstFrame) {
      return "Add an opening frame";
    }
    if (
      state.mode === "first_last" &&
      (!state.firstFrame || !state.lastFrame)
    ) {
      return "Add both opening and closing frames";
    }
    if (state.mode === "references" && state.references.length === 0) {
      return "Add at least one reference";
    }
    return null;
  };

  const generate = async () => {
    if (!scene) return;
    const blocked = generateBlockedReason();
    if (blocked) {
      setError(blocked);
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      await persistScene(state);
      const body: CreateGenerationBody = {
        sceneId: scene.id,
        mode: state.mode,
        prompt: state.prompt,
        duration: state.duration,
        resolution: state.resolution,
        aspectRatio: state.aspectRatio,
        generateAudio: state.generateAudio,
        returnLastFrame: state.returnLastFrame,
        firstFrameAssetId: state.firstFrame?.assetId ?? null,
        lastFrameAssetId: state.lastFrame?.assetId ?? null,
        references:
          state.mode === "references"
            ? taggedRefs.map((r) => ({
                assetId: r.assetId,
                characterId: r.characterId ?? null,
                label: r.label,
              }))
            : undefined,
        idempotencyKey: crypto.randomUUID(),
      };
      await api.createGeneration(body);
      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setGenerating(false);
    }
  };

  const stateRef = useRef(state);
  const generateRef = useRef(generate);
  const persistRef = useRef(persistScene);
  stateRef.current = state;
  generateRef.current = generate;
  persistRef.current = persistScene;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        void generateRef.current();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void persistRef.current(stateRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onUpload = async (file: File) => {
    if (!scene) return;
    const form = new FormData();
    form.append("file", file);
    form.append("projectId", scene.project_id);
    form.append("sceneId", scene.id);
    form.append("role", uploadRoleRef.current);
    try {
      const res = await api.uploadAsset(form);
      const item: StripItem = {
        id: crypto.randomUUID(),
        assetId: res.asset.id,
        label: file.name,
        url: res.url,
        role: uploadRoleRef.current,
      };
      if (uploadRoleRef.current === "first_frame") {
        update({
          firstFrame: item,
          mode: state.mode === "text" ? "first_frame" : state.mode,
          ...(FRAME_MODES.has(state.mode === "text" ? "first_frame" : state.mode)
            ? { aspectRatio: "adaptive" as const }
            : {}),
        });
      } else if (uploadRoleRef.current === "last_frame") {
        update({ lastFrame: item, mode: "first_last", aspectRatio: "adaptive" });
      } else {
        update({
          references: [...state.references, item],
          mode: "references",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const pickUpload = (role: "reference_image" | "first_frame" | "last_frame") => {
    uploadRoleRef.current = role;
    fileRef.current?.click();
  };

  const insertRefTag = (tag: string) => {
    const ta = textareaRef.current;
    const insert = `${tag} `;
    if (!ta) {
      update({ prompt: `${state.prompt}${insert}` });
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = state.prompt.slice(0, start) + insert + state.prompt.slice(end);
    update({ prompt: next });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + insert.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const isFrameMode = FRAME_MODES.has(state.mode);
  const activeMode = MODES.find((m) => m.id === state.mode);
  const generateDisabled = generating || Boolean(generateBlockedReason());

  if (!scene) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-[var(--surface-0)] text-[13px] text-[var(--text-faint)]">
        Select a scene to compose
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-col bg-[var(--surface-0)]">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--line)] px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1 rounded-full bg-[var(--panel)] p-1">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = state.mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                data-active={active ? "true" : "false"}
                className={cn(
                  "mode-pill inline-flex items-center gap-1.5",
                  !active && "hover:bg-[var(--panel-hover)] hover:text-[var(--text)]",
                )}
                title={m.hint}
              >
                <Icon className="size-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-[var(--text-faint)]">
          {saving ? "Saving…" : "Saved"}
          <span className="hidden sm:inline">
            {modKeyLabel()}+Enter generate · {modKeyLabel()}+S save
          </span>
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
        <div className="composer-measure space-y-4">
        {activeMode ? (
          <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">
            {activeMode.hint}
          </p>
        ) : null}

        {isFrameMode ? (
          <div className="panel-surface space-y-3 p-3">
            <div>
              <div className="text-[12px] font-medium text-[var(--text)]">
                {state.mode === "first_frame" ? "Starting frame" : "Keyframe frames"}
              </div>
              <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                Drop the image that opens the shot
                {state.mode === "first_last" ? " — and the one that closes it" : ""}.
                Aspect follows the frame.
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                Seedance frame mode
              </p>
            </div>
            <div
              className={cn(
                "grid gap-3",
                state.mode === "first_last" ? "sm:grid-cols-2" : "grid-cols-1",
              )}
            >
              <FrameDropZone
                title="First frame"
                roleHint="Opening frame"
                item={state.firstFrame}
                onPick={() => pickUpload("first_frame")}
                onClear={() => update({ firstFrame: null })}
              />
              {state.mode === "first_last" ? (
                <FrameDropZone
                  title="Last frame"
                  roleHint="Closing frame"
                  item={state.lastFrame}
                  onPick={() => pickUpload("last_frame")}
                  onClear={() => update({ lastFrame: null })}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {state.mode === "references" ? (
          <div className="panel-surface space-y-3 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[12px] font-medium text-[var(--text)]">
                  Reference images
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                  Character and style refs — click a thumb to insert{" "}
                  <span className="font-mono text-accent">@imageN</span> into the prompt.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                <StripBtn onClick={() => pickUpload("reference_image")}>
                  <Upload className="size-3" /> Upload
                </StripBtn>
                <StripBtn onClick={() => setCharLibOpen(true)}>
                  <Users className="size-3" /> Characters
                </StripBtn>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {taggedRefs.map((r) => {
                const item = state.references.find((x) => x.id === r.id);
                return (
                  <FrameThumb
                    key={r.id}
                    tag={r.tag}
                    item={item ?? { id: r.id, assetId: r.assetId, label: r.label }}
                    onRemove={() =>
                      update({
                        references: state.references.filter((x) => x.id !== r.id),
                      })
                    }
                    onInsertTag={() => insertRefTag(r.tag)}
                  />
                );
              })}
              {state.references.length === 0 ? (
                <button
                  type="button"
                  onClick={() => pickUpload("reference_image")}
                  className="frame-drop flex min-h-[88px] w-full flex-col items-center justify-center gap-1.5 px-3 py-4 text-[12px] text-[var(--text-faint)]"
                >
                  <ImagePlus className="size-5 text-accent/80" />
                  Add reference images or characters
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="panel-surface p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[12px] font-medium text-[var(--text)]">Prompt</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSnippets((v) => !v)}
                className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Snippets
              </button>
              <button
                type="button"
                title="Copy"
                onClick={() => void navigator.clipboard.writeText(state.prompt)}
                className="inline-flex size-7 items-center justify-center rounded-full border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <ClipboardCopy className="size-3" />
              </button>
              <button
                type="button"
                title="Clear"
                onClick={() => update({ prompt: "" })}
                className="inline-flex size-7 items-center justify-center rounded-full border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <Eraser className="size-3" />
              </button>
              <span className="ml-1 font-mono text-[11px] tabular-nums text-[var(--text-faint)]">
                {state.prompt.length}
              </span>
            </div>
          </div>
          {showSnippets && snippets.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {snippets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    update({
                      prompt: state.prompt
                        ? `${state.prompt.trimEnd()}\n${s.body}`
                        : s.body,
                    })
                  }
                  className="rounded-full border border-[var(--line)] bg-[var(--panel-raised)] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)] hover:border-accent/40 hover:text-accent"
                >
                  {s.title}
                </button>
              ))}
            </div>
          ) : null}
          <textarea
            ref={textareaRef}
            value={state.prompt}
            onChange={(e) => update({ prompt: e.target.value })}
            rows={7}
            placeholder={
              state.mode === "references"
                ? "Describe the shot… cite references with @image1, @image2…"
                : "Describe the shot…"
            }
            className="w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-accent/40"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset className="panel-surface p-3">
            <legend className="field-legend">Resolution</legend>
            <div className="flex flex-wrap gap-1.5">
              <ResChip
                active={state.resolution === "480p"}
                onClick={() => update({ resolution: "480p" })}
                label="480p"
                hint="Draft / Series"
              />
              <ResChip
                active={state.resolution === "720p"}
                onClick={() => update({ resolution: "720p" })}
                label="720p"
                hint="Final"
              />
            </div>
          </fieldset>

          <fieldset className="panel-surface p-3">
            <legend className="field-legend">Duration</legend>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_CHIPS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setCustomDuration(false);
                    update({ duration: d });
                  }}
                  className={cn(
                    "rounded-full border px-2.5 py-1 font-mono text-[12px]",
                    !customDuration && state.duration === d
                      ? "border-accent/40 bg-accent-dim text-accent"
                      : "border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]",
                  )}
                >
                  {d}s
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomDuration(true)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[12px]",
                  customDuration
                    ? "border-accent/40 bg-accent-dim text-accent"
                    : "border-[var(--line)] text-[var(--text-muted)]",
                )}
              >
                Custom
              </button>
              {customDuration ? (
                <input
                  type="number"
                  min={MIN_DURATION}
                  max={MAX_DURATION}
                  value={state.duration}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) {
                      update({
                        duration: Math.min(
                          MAX_DURATION,
                          Math.max(MIN_DURATION, Math.round(n)),
                        ),
                      });
                    }
                  }}
                  className="w-16 rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1 font-mono text-[12px] outline-none"
                />
              ) : null}
            </div>
          </fieldset>

          <fieldset className="panel-surface p-3">
            <legend className="field-legend">Aspect ratio</legend>
            {isFrameMode ? (
              <div className="space-y-1.5">
                <button
                  type="button"
                  disabled
                  className="rounded-full border border-accent/40 bg-accent-dim px-3 py-1.5 font-mono text-[11px] text-accent"
                >
                  adaptive
                </button>
                <p className="text-[12px] text-[var(--text-muted)]">
                  Locked — aspect follows the frame.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_RATIOS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update({ aspectRatio: r })}
                    className={cn(
                      "rounded-full border px-2.5 py-1 font-mono text-[11px]",
                      state.aspectRatio === r
                        ? "border-accent/40 bg-accent-dim text-accent"
                        : "border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="panel-surface space-y-2 p-3">
            <legend className="field-legend">Options</legend>
            <Toggle
              label="Generate audio"
              checked={state.generateAudio}
              onChange={(v) => update({ generateAudio: v })}
            />
            <Toggle
              label="Return last frame"
              checked={state.returnLastFrame}
              onChange={(v) => update({ returnLastFrame: v })}
            />
          </fieldset>
        </div>

        {error ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/10 px-2.5 py-2 text-[12px] text-danger">
            {error}
          </div>
        ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--panel)] px-3 py-3">
        <button
          type="button"
          onClick={() => void persistScene(state)}
          className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          Save now
        </button>
        <button
          type="button"
          disabled={generateDisabled}
          title={generateBlockedReason() ?? undefined}
          onClick={() => void generate()}
          className="gen-btn inline-flex items-center gap-2 px-6 py-2.5 text-[13px] transition-transform"
        >
          {generating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Generate
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onUpload(file);
          e.target.value = "";
        }}
      />

      <CharacterLibrary
        open={charLibOpen}
        onOpenChange={setCharLibOpen}
        projectId={scene.project_id}
        onPick={(item) =>
          update({
            references: [...state.references, item],
            mode: "references",
          })
        }
      />
    </section>
  );
}

function defaultState(): ComposerState {
  return {
    mode: "text",
    prompt: "",
    duration: 15,
    resolution: "480p",
    aspectRatio: "9:16",
    generateAudio: true,
    returnLastFrame: true,
    firstFrame: null,
    lastFrame: null,
    references: [],
  };
}

function FrameDropZone({
  title,
  roleHint,
  item,
  onPick,
  onClear,
}: {
  title: string;
  roleHint: string;
  item: StripItem | null;
  onPick: () => void;
  onClear: () => void;
}) {
  const [url, setUrl] = useState(item?.url ?? null);

  useEffect(() => {
    if (!item) {
      setUrl(null);
      return;
    }
    if (item.url) {
      setUrl(item.url);
      return;
    }
    let cancelled = false;
    void api.assetUrl(item.assetId).then((r) => {
      if (!cancelled) setUrl(r.url);
    });
    return () => {
      cancelled = true;
    };
  }, [item?.assetId, item?.url, item]);

  if (item) {
    return (
      <div className="frame-drop group relative min-h-[160px]">
        {url ? (
          <img
            src={url}
            alt={item.label}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[160px] items-center justify-center text-[12px] text-[var(--text-faint)]">
            Loading…
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent p-3">
          <div>
            <div className="text-[12px] font-medium text-white">{title}</div>
            <div className="text-[11px] text-white/75">{roleHint}</div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onPick}
              className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-white backdrop-blur hover:bg-white/25"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex size-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              title="Clear"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button type="button" onClick={onPick} className="frame-drop flex w-full flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-accent-dim text-accent">
        <Upload className="size-4" />
      </div>
      <div>
        <div className="text-[13px] font-medium text-[var(--text)]">{title}</div>
        <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">{roleHint}</div>
        <div className="mt-1.5 text-[11px] text-[var(--text-faint)]">
          Click to upload image
        </div>
      </div>
    </button>
  );
}

function StripBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]"
    >
      {children}
    </button>
  );
}

function FrameThumb({
  tag,
  item,
  onRemove,
  onInsertTag,
}: {
  tag: string;
  item: StripItem;
  onRemove: () => void;
  onInsertTag?: () => void;
}) {
  const [url, setUrl] = useState(item.url ?? null);
  useEffect(() => {
    if (item.url) {
      setUrl(item.url);
      return;
    }
    let cancelled = false;
    void api.assetUrl(item.assetId).then((r) => {
      if (!cancelled) setUrl(r.url);
    });
    return () => {
      cancelled = true;
    };
  }, [item.assetId, item.url]);

  return (
    <div className="group relative w-20 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel-raised)]">
      <button
        type="button"
        className="block w-full"
        onClick={onInsertTag}
        title={onInsertTag ? `Insert ${tag}` : item.label}
      >
        <div className="aspect-square bg-black">
          {url ? (
            <img src={url} alt={item.label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-[var(--text-faint)]">
              …
            </div>
          )}
        </div>
        <div className="truncate px-1 py-0.5 font-mono text-[10px] text-accent">{tag}</div>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white opacity-0 group-hover:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function ResChip({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3 py-1.5 text-left",
        active
          ? "border-accent/40 bg-accent-dim"
          : "border-[var(--line)] hover:border-[var(--line-strong)]",
      )}
    >
      <div className={cn("font-mono text-[12px]", active ? "text-accent" : "text-[var(--text)]")}>
        {label}
      </div>
      <div className="text-[10px] text-[var(--text-faint)]">{hint}</div>
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5">
      <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-[var(--surface-4)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-[#041512] transition-transform",
            checked ? "left-4" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}
