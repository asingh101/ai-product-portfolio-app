"use client";

import { useState } from "react";
import { useCollectionEditor } from "@/hooks/useCollectionEditor";
import { BlockEditor } from "@/components/admin/BlockEditor";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { GalleryUploader, GalleryImage } from "@/components/admin/GalleryUploader";
import { MarkdownTextField } from "@/components/admin/MarkdownTextField";
import { ContentBlock } from "@/types/blocks";
import { syncEventsToRag } from "@/lib/ragSync";

interface EventItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  date: string;
  location?: string;
  thumbnail?: string;
  gallery: GalleryImage[];
  blocks: ContentBlock[];
  status: "draft" | "published";
  sortOrder: number;
}

const EVENT_CATEGORIES = [
  "Conference",
  "Hackathon",
  "Workshop",
  "Networking",
  "Immersion",
  "Other",
];

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || `event-${Date.now()}`;
}

export default function AdminEventsPage() {
  const { items: events, loading, saveItem, deleteItem } =
    useCollectionEditor<EventItem>("events", { orderField: "sortOrder", orderDirection: "asc" });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<EventItem>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const editEvent = (event: EventItem) => {
    setEditingId(event.id);
    setDraft({ ...event });
  };

  const startNew = () => {
    const id = `event-${Date.now()}`;
    setEditingId(id);
    setDraft({
      slug: "",
      title: "",
      category: EVENT_CATEGORIES[0],
      description: "",
      date: "",
      location: "",
      thumbnail: "",
      gallery: [],
      blocks: [],
      status: "draft",
      sortOrder: events.length,
    });
  };

  const handleSave = async () => {
    if (!editingId || !draft.title) return;
    setSaving(true);
    try {
      const slug = draft.slug || generateSlug(draft.title);
      await saveItem(editingId, { ...draft, slug } as Partial<EventItem>);
      setSuccessMsg("Event saved!");
      setTimeout(() => setSuccessMsg(null), 3000);
      setEditingId(null);
      setDraft({});
      syncEventsToRag(events).catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await deleteItem(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Detail editor
  if (editingId) {
    return (
      <div className="max-w-4xl pb-20">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => { setEditingId(null); setDraft({}); }} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="text-sm font-bold">Back to Events</span>
          </button>
          <div className="flex items-center gap-3">
            <select value={draft.status || "draft"} onChange={(e) => setDraft({ ...draft, status: e.target.value as "draft" | "published" })} className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <button onClick={handleSave} disabled={saving} className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-on-primary/20 border-t-on-primary rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">save</span>}
              {saving ? "Saving..." : "Save Event"}
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
          {/* Card fields */}
          <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">info</span>
              <h2 className="font-bold font-[family-name:var(--font-headline)]">Event Details</h2>
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
                    placeholder="Event title"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Category</label>
                    <select value={draft.category || EVENT_CATEGORIES[0]} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none">
                      {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Date</label>
                    <input type="text" value={draft.date || ""} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none" placeholder="e.g. March 2025" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Location</label>
                    <input type="text" value={draft.location || ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none" placeholder="San Jose, CA" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Description</label>
                  <MarkdownTextField
                    rows={3}
                    value={draft.description || ""}
                    onChange={(v) => setDraft({ ...draft, description: v })}
                    textareaClassName="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none"
                    placeholder="Short description for the card..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Thumbnail</label>
                <ImageUploader value={draft.thumbnail || ""} onChange={(url) => setDraft({ ...draft, thumbnail: url })} storagePath={`events/${draft.slug || "new"}`} aspectRatio="aspect-square" />
              </div>
            </div>
          </section>

          {/* Photo Gallery */}
          <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">photo_library</span>
              <h2 className="font-bold font-[family-name:var(--font-headline)]">Photo Gallery</h2>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">Upload multiple images for this event. These appear in a gallery on the event detail page.</p>
            <GalleryUploader
              value={draft.gallery || []}
              onChange={(gallery) => setDraft({ ...draft, gallery })}
              storagePath={`events/${draft.slug || "new"}`}
            />
          </section>

          {/* Block content */}
          <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">description</span>
              <h2 className="font-bold font-[family-name:var(--font-headline)]">Event Write-up</h2>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">Build the full event recap using content blocks.</p>
            <BlockEditor
              blocks={draft.blocks || []}
              onChange={(blocks) => setDraft({ ...draft, blocks })}
              storagePath={`events/${draft.slug || "new"}`}
            />
          </section>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-4xl pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">Events</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage event recaps, photos, and write-ups.</p>
        </div>
        <button onClick={startNew} className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          New Event
        </button>
      </header>

      {successMsg && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 bg-green-50 text-green-700 border border-green-200">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {successMsg}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant/50 border-2 border-dashed border-outline-variant/30 rounded-2xl">
          <span className="material-symbols-outlined text-5xl mb-4 block">event</span>
          <p className="text-sm font-bold uppercase tracking-widest mb-2">No events yet</p>
          <p className="text-xs">Click &ldquo;New Event&rdquo; to create your first event.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-5 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow group">
              {event.thumbnail && (
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                  <img src={event.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-on-surface truncate">{event.title || "Untitled"}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${event.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {event.status || "draft"}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant truncate">{event.category} &middot; {event.date} &middot; {(event.gallery || []).length} photos</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => editEvent(event)} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-colors">Edit</button>
                <button onClick={() => handleDelete(event.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
