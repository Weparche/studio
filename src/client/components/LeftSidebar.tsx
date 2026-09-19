import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Film,
  FolderPlus,
  Layers,
  Plus,
} from "lucide-react";
import type { Episode, Project, Scene } from "@shared/types";
import { cn } from "@/client/lib/utils";

interface LeftSidebarProps {
  projects: Project[];
  episodes: Episode[];
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onCreateProject: (name: string) => Promise<void>;
  onCreateEpisode: (projectId: string, name: string, episodeNumber: number) => Promise<void>;
  onCreateScene: (episodeId: string, title: string) => Promise<void>;
}

export function LeftSidebar({
  projects,
  episodes,
  scenes,
  selectedSceneId,
  onSelectScene,
  onCreateProject,
  onCreateEpisode,
  onCreateScene,
}: LeftSidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [expandedEpisodes, setExpandedEpisodes] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState<"project" | null>(null);
  const [draft, setDraft] = useState("");

  const episodesByProject = useMemo(() => {
    const map = new Map<string, Episode[]>();
    for (const ep of episodes) {
      const list = map.get(ep.project_id) ?? [];
      list.push(ep);
      map.set(ep.project_id, list);
    }
    return map;
  }, [episodes]);

  const scenesByEpisode = useMemo(() => {
    const map = new Map<string, Scene[]>();
    for (const sc of scenes) {
      const list = map.get(sc.episode_id) ?? [];
      list.push(sc);
      map.set(sc.episode_id, list);
    }
    return map;
  }, [scenes]);

  const toggleProject = (id: string) =>
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleEpisode = (id: string) =>
    setExpandedEpisodes((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className="flex min-h-0 flex-col border-r border-[var(--line)] bg-[var(--panel)]">
      <div className="flex h-9 items-center justify-between border-b border-[var(--line)] px-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
          Projects
        </span>
        <button
          type="button"
          title="New project"
          onClick={() => {
            setCreating("project");
            setDraft("");
          }}
          className="inline-flex size-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--panel-hover)] hover:text-[var(--text)]"
        >
          <FolderPlus className="size-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {creating === "project" ? (
          <form
            className="mb-2 px-1"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              await onCreateProject(draft.trim());
              setCreating(null);
              setDraft("");
            }}
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (!draft.trim()) setCreating(null);
              }}
              placeholder="Project name"
              className="w-full rounded border border-accent/40 bg-[var(--panel-raised)] px-2 py-1 text-[12px] outline-none"
            />
          </form>
        ) : null}

        {projects.length === 0 ? (
          <div className="px-2 py-6 text-center text-[12px] text-[var(--text-faint)]">
            No projects yet
          </div>
        ) : (
          projects.map((project) => {
            const open = expandedProjects[project.id] ?? true;
            const projectEps = episodesByProject.get(project.id) ?? [];
            return (
              <div key={project.id} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => toggleProject(project.id)}
                  className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[12px] hover:bg-[var(--panel-hover)]"
                >
                  {open ? (
                    <ChevronDown className="size-3.5 text-[var(--text-faint)]" />
                  ) : (
                    <ChevronRight className="size-3.5 text-[var(--text-faint)]" />
                  )}
                  <Layers className="size-3.5 text-accent" />
                  <span className="truncate font-medium">{project.name}</span>
                  <button
                    type="button"
                    title="Add episode"
                    className="ml-auto inline-flex size-5 items-center justify-center rounded text-[var(--text-faint)] hover:bg-[var(--surface-4)] hover:text-[var(--text)]"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const nextNum =
                        projectEps.reduce((m, ep) => Math.max(m, ep.episode_number), 0) + 1;
                      await onCreateEpisode(project.id, `Episode ${nextNum}`, nextNum);
                      setExpandedProjects((p) => ({ ...p, [project.id]: true }));
                    }}
                  >
                    <Plus className="size-3" />
                  </button>
                </button>

                {open
                  ? projectEps.map((ep) => {
                      const epOpen = expandedEpisodes[ep.id] ?? true;
                      const epScenes = scenesByEpisode.get(ep.id) ?? [];
                      return (
                        <div key={ep.id} className="ml-3">
                          <button
                            type="button"
                            onClick={() => toggleEpisode(ep.id)}
                            className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[12px] text-[var(--text-muted)] hover:bg-[var(--panel-hover)] hover:text-[var(--text)]"
                          >
                            {epOpen ? (
                              <ChevronDown className="size-3 text-[var(--text-faint)]" />
                            ) : (
                              <ChevronRight className="size-3 text-[var(--text-faint)]" />
                            )}
                            <Film className="size-3" />
                            <span className="truncate">
                              E{ep.episode_number} · {ep.name}
                            </span>
                            <button
                              type="button"
                              title="Add scene"
                              className="ml-auto inline-flex size-5 items-center justify-center rounded text-[var(--text-faint)] hover:bg-[var(--surface-4)] hover:text-[var(--text)]"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await onCreateScene(ep.id, `Scene ${epScenes.length + 1}`);
                                setExpandedEpisodes((p) => ({ ...p, [ep.id]: true }));
                              }}
                            >
                              <Plus className="size-3" />
                            </button>
                          </button>
                          {epOpen
                            ? epScenes.map((sc) => (
                                <button
                                  key={sc.id}
                                  type="button"
                                  onClick={() => onSelectScene(sc.id)}
                                  className={cn(
                                    "ml-4 flex w-[calc(100%-1rem)] items-center rounded px-2 py-1 text-left text-[12px]",
                                    selectedSceneId === sc.id
                                      ? "bg-accent-dim text-accent"
                                      : "text-[var(--text-muted)] hover:bg-[var(--panel-hover)] hover:text-[var(--text)]",
                                  )}
                                >
                                  <span className="truncate">{sc.title}</span>
                                </button>
                              ))
                            : null}
                        </div>
                      );
                    })
                  : null}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
