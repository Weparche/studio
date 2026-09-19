import { useCallback, useEffect, useMemo, useState } from "react";
import type { Episode, Generation, Project, Scene } from "@shared/types";
import { LeftSidebar } from "@/client/components/LeftSidebar";
import { RightSidebar, type GenerationFilter } from "@/client/components/RightSidebar";
import { SceneComposer } from "@/client/components/SceneComposer";
import { GenerationViewer } from "@/client/components/GenerationViewer";
import { TopBar } from "@/client/components/TopBar";
import type { StripItem } from "@/client/components/CharacterLibrary";
import {
  api,
  type ProviderBilling,
  type ProviderStatus,
  type SceneDetail,
} from "@/client/lib/api";
import { useInterval } from "@/client/hooks/useDebounce";
import { cn } from "@/client/lib/utils";

const TERMINAL = new Set(["succeeded", "failed", "expired", "cancelled"]);

export function StudioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [scene, setScene] = useState<SceneDetail | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    selected: 0,
    generating: 0,
    failed: 0,
  });
  const [filter, setFilter] = useState<GenerationFilter>("all");
  const [viewer, setViewer] = useState<Generation | null>(null);
  const [restoreFrom, setRestoreFrom] = useState<Generation | null>(null);
  const [continueFrom, setContinueFrom] = useState<{
    generation: Generation;
    lastFrameAssetId: string;
  } | null>(null);
  const [injectFirstFrame, setInjectFirstFrame] = useState<StripItem | null>(null);
  const [injectReference, setInjectReference] = useState<StripItem | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [billing, setBilling] = useState<ProviderBilling | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"tree" | "compose" | "gens">("compose");

  const refreshTree = useCallback(async () => {
    const tree = await api.tree();
    setProjects(tree.projects);
    setEpisodes(tree.episodes);
    setScenes(tree.scenes);
    if (!selectedSceneId && tree.scenes[0]) {
      setSelectedSceneId(tree.scenes[0].id);
    }
  }, [selectedSceneId]);

  const refreshGenerations = useCallback(async (sceneId: string, f: GenerationFilter) => {
    const res = await api.generations(sceneId, f);
    setGenerations(res.generations);
    setSummary(res.summary);
  }, []);

  const refreshBilling = useCallback(async () => {
    setBillingLoading(true);
    try {
      const [status, bill] = await Promise.all([
        api.providerStatus(),
        api.providerBilling(),
      ]);
      setProviderStatus(status);
      setBilling(bill);
    } catch {
      /* ignore transient */
    } finally {
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refreshTree();
        await refreshBilling();
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load studio");
      }
    })();
  }, [refreshTree, refreshBilling]);

  useEffect(() => {
    if (!selectedSceneId) {
      setScene(null);
      setGenerations([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [sceneRes] = await Promise.all([
          api.getScene(selectedSceneId),
          refreshGenerations(selectedSceneId, filter),
        ]);
        if (!cancelled) setScene(sceneRes.scene);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load scene");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSceneId, filter, refreshGenerations]);

  const activeIds = useMemo(
    () => generations.filter((g) => !TERMINAL.has(g.status)).map((g) => g.id),
    [generations],
  );

  useInterval(
    () => {
      if (!selectedSceneId || activeIds.length === 0) return;
      void (async () => {
        await Promise.all(
          activeIds.map(async (id) => {
            try {
              await api.getGeneration(id);
            } catch {
              /* keep polling */
            }
          }),
        );
        await refreshGenerations(selectedSceneId, filter);
      })();
    },
    selectedSceneId && activeIds.length > 0 ? 4000 : null,
  );

  useInterval(() => {
    void refreshBilling();
  }, 60_000);

  const breadcrumb = useMemo(() => {
    if (!scene) return { project: null, episode: null, title: null };
    return {
      project: scene.project_name,
      episode: `E${scene.episode_number} · ${scene.episode_name}`,
      title: scene.title,
    };
  }, [scene]);

  const onFavorite = async (g: Generation) => {
    await api.favoriteGeneration(g.id, !g.is_favorite);
    if (selectedSceneId) await refreshGenerations(selectedSceneId, filter);
    if (viewer?.id === g.id) {
      setViewer({ ...g, is_favorite: !g.is_favorite });
    }
  };

  const onRetry = async (g: Generation) => {
    await api.retryGeneration(g.id);
    if (selectedSceneId) await refreshGenerations(selectedSceneId, filter);
  };

  const onDelete = async (g: Generation) => {
    if (!window.confirm("Delete this generation?")) return;
    await api.deleteGeneration(g.id);
    if (viewer?.id === g.id) setViewer(null);
    if (selectedSceneId) await refreshGenerations(selectedSceneId, filter);
  };

  const onDuplicate = (g: Generation) => {
    setRestoreFrom(g);
    setContinueFrom(null);
    setMobileTab("compose");
  };

  const onContinue = async (g: Generation) => {
    const detail = await api.getGeneration(g.id);
    const assetId = detail.generatedLastFrameAssetId;
    if (!assetId) {
      setLoadError("No generated last frame on this clip — enable Return last frame on the next run.");
      return;
    }
    setContinueFrom({ generation: g, lastFrameAssetId: assetId });
    setRestoreFrom(null);
    setMobileTab("compose");
  };

  const onUseFirstFrame = async (g: Generation) => {
    const detail = await api.getGeneration(g.id);
    const assetId = detail.generatedLastFrameAssetId ?? g.first_frame_asset_id;
    if (!assetId) {
      setLoadError("No frame asset available on this generation.");
      return;
    }
    setInjectFirstFrame({
      id: crypto.randomUUID(),
      assetId,
      label: "From generation",
      role: "first_frame",
    });
    setMobileTab("compose");
  };

  const onUseReference = async (g: Generation) => {
    const detail = await api.getGeneration(g.id);
    const assetId = detail.generatedLastFrameAssetId;
    if (!assetId) {
      setLoadError("No last-frame asset to use as a reference.");
      return;
    }
    setInjectReference({
      id: crypto.randomUUID(),
      assetId,
      label: "Ref from gen",
      role: "reference_image",
    });
    setMobileTab("compose");
  };

  const genActions = {
    onOpen: (g: Generation) => setViewer(g),
    onFavorite: (g: Generation) => void onFavorite(g),
    onDuplicate,
    onRetry: (g: Generation) => void onRetry(g),
    onDelete: (g: Generation) => void onDelete(g),
    onContinue: (g: Generation) => void onContinue(g),
    onUseFirstFrame: (g: Generation) => void onUseFirstFrame(g),
    onUseReference: (g: Generation) => void onUseReference(g),
  };

  const onConsumedInject = useCallback(() => {
    setInjectFirstFrame(null);
    setInjectReference(null);
    setRestoreFrom(null);
    setContinueFrom(null);
  }, []);

  return (
    <div className="studio-grid">
      <TopBar
        projectName={breadcrumb.project}
        episodeName={breadcrumb.episode}
        sceneTitle={breadcrumb.title}
        activeGenerations={summary.generating}
        providerStatus={providerStatus}
        billing={billing}
        billingLoading={billingLoading}
      />

      {loadError ? (
        <div className="col-span-full flex items-center justify-between gap-3 border-b border-danger/30 bg-danger/10 px-3 py-1.5 text-[12px] text-danger">
          <span>{loadError}</span>
          <button
            type="button"
            className="rounded px-2 py-0.5 text-[11px] hover:bg-danger/20"
            onClick={() => setLoadError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Mobile tabs */}
      <div className="mobile-tabs flex border-b border-[var(--line)] bg-[var(--panel)] lg:hidden">
        {(
          [
            ["tree", "Scenes"],
            ["compose", "Composer"],
            ["gens", "Gens"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobileTab(id)}
            className={cn(
              "flex-1 py-2 text-[12px]",
              mobileTab === id
                ? "border-b-2 border-accent text-accent"
                : "text-[var(--text-muted)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "min-h-0 lg:block",
          mobileTab === "tree" ? "block" : "hidden lg:block",
        )}
      >
        <LeftSidebar
          projects={projects}
          episodes={episodes}
          scenes={scenes}
          selectedSceneId={selectedSceneId}
          onSelectScene={(id) => {
            setSelectedSceneId(id);
            setMobileTab("compose");
          }}
          onCreateProject={async (name) => {
            await api.createProject({ name });
            await refreshTree();
          }}
          onCreateEpisode={async (projectId, name, episodeNumber) => {
            await api.createEpisode(projectId, { name, episodeNumber });
            await refreshTree();
          }}
          onCreateScene={async (episodeId, title) => {
            const res = await api.createScene(episodeId, { title });
            await refreshTree();
            setSelectedSceneId(res.scene.id);
          }}
        />
      </div>

      <div
        className={cn(
          "min-h-0 min-w-0 lg:block",
          mobileTab === "compose" ? "block" : "hidden lg:block",
        )}
      >
        {/* Mobile scene selector */}
        <div className="border-b border-[var(--line)] bg-[var(--panel)] px-2 py-1.5 lg:hidden">
          <select
            value={selectedSceneId ?? ""}
            onChange={(e) => setSelectedSceneId(e.target.value || null)}
            className="w-full rounded border border-[var(--line)] bg-[var(--panel-raised)] px-2 py-1.5 text-[12px] outline-none"
          >
            <option value="">Select scene…</option>
            {scenes.map((sc) => {
              const ep = episodes.find((e) => e.id === sc.episode_id);
              const proj = ep ? projects.find((p) => p.id === ep.project_id) : null;
              return (
                <option key={sc.id} value={sc.id}>
                  {proj?.name ?? "?"} / {ep?.name ?? "?"} / {sc.title}
                </option>
              );
            })}
          </select>
        </div>
        <SceneComposer
          scene={scene}
          onGenerated={() => {
            if (selectedSceneId) void refreshGenerations(selectedSceneId, filter);
            setMobileTab("gens");
          }}
          restoreFrom={restoreFrom}
          continueFrom={continueFrom}
          injectFirstFrame={injectFirstFrame}
          injectReference={injectReference}
          onConsumedInject={onConsumedInject}
        />
      </div>

      <div
        className={cn(
          "min-h-0 lg:block",
          mobileTab === "gens" ? "block" : "hidden lg:block",
        )}
      >
        <RightSidebar
          generations={generations}
          summary={summary}
          filter={filter}
          onFilterChange={setFilter}
          {...genActions}
        />
      </div>

      <GenerationViewer
        generation={viewer}
        open={viewer != null}
        onOpenChange={(open) => {
          if (!open) setViewer(null);
        }}
        onFavorite={genActions.onFavorite}
        onDuplicate={genActions.onDuplicate}
        onRetry={genActions.onRetry}
        onContinue={genActions.onContinue}
        onUseFirstFrame={genActions.onUseFirstFrame}
        onUseReference={genActions.onUseReference}
      />
    </div>
  );
}
