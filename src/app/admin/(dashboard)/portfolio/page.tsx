"use client";

import { useState, useMemo } from "react";
import { useCollectionEditor } from "@/hooks/useCollectionEditor";
import { BlockEditor } from "@/components/admin/BlockEditor";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { MarkdownTextField } from "@/components/admin/MarkdownTextField";
import { ContentBlock } from "@/types/blocks";
import { syncProjectsToRag } from "@/lib/ragSync";
import { DEPRECATED_PORTFOLIO_SLUGS } from "@/lib/bundledPortfolioProjects";

interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  metrics: { value: string; label: string }[];
  thumbnail?: string;
  blocks: ContentBlock[];
  status: "draft" | "published";
  sortOrder: number;
}

const CATEGORIES = [
  "Product Management",
  "Strategic Analysis",
  "Marketing",
  "Branding",
  "Engineering",
];

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || `project-${Date.now()}`;
}

function resolveFirestoreProject(project: Project, firestoreProjects: Project[]) {
  return (
    firestoreProjects.find((p) => p.id === project.id) ??
    firestoreProjects.find((p) => p.slug === project.slug)
  );
}

export default function AdminPortfolioPage() {
  const { items: firestoreProjects, loading, saveItem, deleteItem } =
    useCollectionEditor<Project>("projects", { orderField: "sortOrder", orderDirection: "asc" });

  const projects = useMemo(
    () => firestoreProjects.filter((p) => !DEPRECATED_PORTFOLIO_SLUGS.has(p.slug)),
    [firestoreProjects]
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Project>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const editProject = (project: Project) => {
    setEditingId(project.id);
    setDraft({ ...project });
  };

  const startNew = () => {
    const id = `project-${Date.now()}`;
    setEditingId(id);
    setDraft({
      slug: "",
      title: "",
      category: CATEGORIES[0],
      description: "",
      tags: [],
      metrics: [],
      thumbnail: "",
      blocks: [],
      status: "draft",
      sortOrder: projects.length,
    });
  };

  const handleSave = async () => {
    if (!editingId || !draft.title) return;
    setSaving(true);
    try {
      const slug = draft.slug || generateSlug(draft.title);
      await saveItem(editingId, { ...draft, slug } as Partial<Project>);
      setSuccessMsg("Project saved!");
      setTimeout(() => setSuccessMsg(null), 3000);
      setEditingId(null);
      setDraft({});
      syncProjectsToRag(firestoreProjects).catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    const existing = resolveFirestoreProject(project, firestoreProjects);
    if (!existing) {
      return;
    }
    if (!confirm(`Delete "${existing.title}" from the CMS? This removes it from the live site.`)) return;
    await deleteItem(existing.id);
    setSuccessMsg("Project deleted.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Detail editor view
  if (editingId) {
    return (
      <div className="max-w-4xl pb-20">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => { setEditingId(null); setDraft({}); }}
            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="text-sm font-bold">Back to Projects</span>
          </button>
          <div className="flex items-center gap-3">
            <select
              value={draft.status || "draft"}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as "draft" | "published" })}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-on-primary/20 border-t-on-primary rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">save</span>}
              {saving ? "Saving..." : "Save Project"}
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 bg-green-50 text-green-700 border border-green-200">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {successMsg}
          </div>
        )}

        <div className="space-y-6">
          {/* Card-level fields */}
          <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">info</span>
              <h2 className="font-bold font-[family-name:var(--font-headline)]">Project Card</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Title</label>
                  <MarkdownTextField
                    multiline={false}
                    compactToolbar
                    value={draft.title || ""}
                    onChange={(v) => setDraft({ ...draft, title: v, slug: generateSlug(v) })}
                    textareaClassName="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    placeholder="Project title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Category</label>
                    <select
                      value={draft.category || CATEGORIES[0]}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Slug</label>
                    <input
                      type="text"
                      value={draft.slug || ""}
                      onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Description</label>
                  <MarkdownTextField
                    rows={3}
                    value={draft.description || ""}
                    onChange={(v) => setDraft({ ...draft, description: v })}
                    textareaClassName="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Short description for the card..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Thumbnail</label>
                <ImageUploader
                  value={draft.thumbnail || ""}
                  onChange={(url) => setDraft({ ...draft, thumbnail: url })}
                  storagePath={`projects/${draft.slug || "new"}`}
                  aspectRatio="aspect-square"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(draft.tags || []).map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1 bg-surface-container rounded-full text-xs font-bold">
                    {tag}
                    <button type="button" onClick={() => setDraft({ ...draft, tags: (draft.tags || []).filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600">
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type a tag and press Enter"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val && !(draft.tags || []).includes(val)) {
                      setDraft({ ...draft, tags: [...(draft.tags || []), val] });
                    }
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>

            {/* Metrics */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Metrics</label>
              <div className="space-y-2">
                {(draft.metrics || []).map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={m.value} onChange={(e) => { const next = [...(draft.metrics || [])]; next[i] = { ...next[i], value: e.target.value }; setDraft({ ...draft, metrics: next }); }} placeholder="Value" className="w-24 bg-surface-container-low rounded-lg px-3 py-2 text-sm font-bold focus:outline-none border border-outline-variant/30" />
                    <input type="text" value={m.label} onChange={(e) => { const next = [...(draft.metrics || [])]; next[i] = { ...next[i], label: e.target.value }; setDraft({ ...draft, metrics: next }); }} placeholder="Label" className="flex-1 bg-surface-container-low rounded-lg px-3 py-2 text-sm focus:outline-none border border-outline-variant/30" />
                    <button type="button" onClick={() => setDraft({ ...draft, metrics: (draft.metrics || []).filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-sm">close</span></button>
                  </div>
                ))}
                <button type="button" onClick={() => setDraft({ ...draft, metrics: [...(draft.metrics || []), { value: "", label: "" }] })} className="text-xs text-primary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">add</span> Add metric
                </button>
              </div>
            </div>
          </section>

          {/* Block content (case study detail) */}
          <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">description</span>
              <h2 className="font-bold font-[family-name:var(--font-headline)]">Case Study Content</h2>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">
              Build the full case study using content blocks. This renders on the project detail page.
            </p>
            <BlockEditor
              blocks={draft.blocks || []}
              onChange={(blocks) => setDraft({ ...draft, blocks })}
              storagePath={`projects/${draft.slug || "new"}`}
            />
          </section>
        </div>
      </div>
    );
  }

  // Project list view
  return (
    <div className="max-w-4xl pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">Portfolio Projects</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage case studies and project cards.</p>
        </div>
        <button
          onClick={startNew}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Project
        </button>
      </header>

      {successMsg && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 bg-green-50 text-green-700 border border-green-200">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {successMsg}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant/50 border-2 border-dashed border-outline-variant/30 rounded-2xl">
          <span className="material-symbols-outlined text-5xl mb-4 block">folder_open</span>
          <p className="text-sm font-bold uppercase tracking-widest mb-2">No projects yet</p>
          <p className="text-xs">Click &ldquo;New Project&rdquo; to create your first case study.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-4 p-5 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow group"
            >
              {project.thumbnail && (
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                  <img src={project.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-on-surface truncate">{project.title || "Untitled"}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${project.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {project.status || "draft"}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant truncate">{project.category} &middot; {(project.blocks || []).length} blocks &middot; {project.slug}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => editProject(project)} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(project)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
