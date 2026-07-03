"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { MarkdownTextField } from "@/components/admin/MarkdownTextField";

const SEED_DOCS = [
  { id: "profile", title: "Professional Profile", sortOrder: 10, content: `# Ankit Singh, Professional Profile

## Identity
- **Name:** Ankit Singh
- **Title:** Aspiring Product Manager | Strategic Operations Leader
- **Brand:** The Pristine Strategist
- **Location:** San Francisco Bay Area, CA
- **Education:**
  - MBA Candidate, Santa Clara University (Leavey School of Business), Marketing & Strategy focus
  - M.S. Computer Science, Santa Clara University, Systems & AI focus
  - B.Tech Computer Science & Engineering, India
- **Email:** ankit.singh101@gmail.com
- **Website:** ankitsingh.net

## Professional Summary
Ankit is a strategic operator who bridges the gap between technical engineering and product strategy. With 4+ years of software engineering at Amazon building high-scale systems (1.2M+ users, 99.9% uptime) and an MBA in strategic marketing, he brings a rare dual perspective to product leadership.

## Current Roles & Activities
- **President, SCU Net Impact Club**, Leading 100+ purpose-driven professionals
- **VP, AI Product Club**, Leading hackathons, LLM product critiques, and generative AI workshops
- **MBA Candidate**, Specializing in Marketing & Technology Strategy at Santa Clara University` },
  { id: "experience", title: "Career Experience", sortOrder: 20, content: `# Career Experience

## Amazon, Software Development Engineer II (2019–2023)
- Architected and scaled high-throughput microservices powering Amazon's global fulfillment operations
- Scaled systems serving 1.2M+ users with 99.9% uptime SLA
- Drove 25% improvement in user retention through data-driven feature optimization
- Tech Stack: Java, AWS (DynamoDB, Lambda, SQS, S3), Kubernetes, CI/CD

## Beebizy, Product Manager Intern (Summer 2024)
- Conducted 30+ user interviews, defined MVP feature sets, launched 3 key features
- Built data-driven prioritization frameworks (RICE scoring, impact mapping)

## Atos Syntel, Programmer Analyst (2017–2019)
- Reduced manual processing time by 40% through workflow automation
- Achieved 98% data accuracy across critical business workflows` },
  { id: "projects", title: "Projects & Case Studies", sortOrder: 30, content: `# Projects & Case Studies

## A10 Networks Agentic AI PM Hackathon (2025), 1st Place
- Designed AI-powered Application Delivery Controller for enterprise cybersecurity
- 45% reduction in Mean Time To Resolution (MTTR)

## Amazon B2B EU Market GTM Strategy
- Go-to-market strategy for Amazon Business e-invoicing across 5 EU markets
- 50+ customer interviews, regulatory landscape mapping

## Popup Pickleball Connect
- Business model and financial projections for urban pop-up pickleball venture
- Projected 40% IRR

## Tesla: Navigating the "Stuck in the Middle" Crisis
- Competitive positioning analysis and strategic recommendations` },
  { id: "skills", title: "Skills & Competencies", sortOrder: 40, content: `# Skills & Competencies

## Technical Stack
- Languages: Java, Python, TypeScript, SQL, JavaScript
- Cloud: AWS (DynamoDB, Lambda, SQS, S3), Kubernetes, Docker, CI/CD
- AI & ML: Agentic AI frameworks, LLM integration, RAG architecture, Google Gemini API
- Web: Next.js, React, Tailwind CSS, Node.js, Firebase

## Strategic Operations
- Product Management, Go-to-Market Strategy, Market Research, Financial Modeling
- Brand Strategy, User Psychology, Agile & Leadership

## Core Arsenal (Top 5)
1. SQL, Advanced querying and data analysis
2. AWS, Full-stack cloud architecture
3. Agentic AI, Autonomous agent design
4. Product Ops, End-to-end lifecycle management
5. GTM Strategy, Market entry and competitive positioning` },
  { id: "mentorship-contact", title: "Mentorship & Contact", sortOrder: 50, content: `# Mentorship & Contact

## Mentorship Services
- Career Pivot Strategy (60 min), Engineering to PM transition
- Product Sense Session (45 min), Case studies and mock interviews
- Technical Strategy Review (60 min), System design and architecture
- Free 15-minute intro call available

## Contact Information
- Email: ankit.singh101@gmail.com
- LinkedIn: linkedin.com/in/ankitsingh
- Website: ankitsingh.net
- Location: San Francisco Bay Area, CA` },
];

interface RagDoc {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
  status: "active" | "draft";
  updatedAt?: any;
  autoSync?: boolean;
}

export default function RagContextPage() {
  const [docs, setDocs] = useState<RagDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "draft">("active");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const seeded = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "rag_context"),
      async (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as RagDoc))
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setDocs(items);
        setLoading(false);

        if (items.length === 0 && !seeded.current) {
          seeded.current = true;
          for (const seed of SEED_DOCS) {
            await setDoc(doc(db, "rag_context", seed.id), {
              title: seed.title,
              content: seed.content,
              sortOrder: seed.sortOrder,
              status: "active",
              autoSync: false,
              updatedAt: serverTimestamp(),
            });
          }
        }
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSaving(true);
    const id = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const maxSort = docs.reduce((max, d) => Math.max(max, d.sortOrder ?? 0), 0);
    await setDoc(doc(db, "rag_context", id), {
      title: newTitle.trim(),
      content: newContent.trim(),
      sortOrder: maxSort + 10,
      status: "active",
      updatedAt: serverTimestamp(),
      autoSync: false,
    });
    setNewTitle("");
    setNewContent("");
    setShowCreate(false);
    setSaving(false);
  };

  const startEdit = (d: RagDoc) => {
    setEditingId(d.id);
    setEditTitle(d.title);
    setEditContent(d.content);
    setEditStatus(d.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleSave = async () => {
    if (!editingId || !editContent.trim()) return;
    setSaving(true);
    await setDoc(
      doc(db, "rag_context", editingId),
      {
        title: editTitle.trim(),
        content: editContent.trim(),
        status: editStatus,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setSaving(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "rag_context", id));
    setDeleteConfirm(null);
    if (editingId === id) cancelEdit();
  };

  const handleToggleStatus = async (d: RagDoc) => {
    const newStatus = d.status === "active" ? "draft" : "active";
    await setDoc(
      doc(db, "rag_context", d.id),
      { status: newStatus, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl pb-20">
      <header className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">
            RAG Context Manager
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Manage the knowledge base that powers the AI chatbot. Changes take effect immediately.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); cancelEdit(); }}
          className="cta-gradient text-white px-5 py-3 rounded-xl text-sm font-bold font-[family-name:var(--font-headline)] inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">{showCreate ? "close" : "add"}</span>
          {showCreate ? "Cancel" : "New Document"}
        </button>
      </header>

      {/* Create form */}
      {showCreate && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 mb-8 border border-outline-variant/10 shadow-sm">
          <h3 className="font-bold text-sm font-[family-name:var(--font-headline)] mb-4">Create New Context Document</h3>
          <MarkdownTextField
            multiline={false}
            compactToolbar
            value={newTitle}
            onChange={setNewTitle}
            placeholder="Document title (e.g. Awards & Certifications)"
            textareaClassName="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm mb-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
            className="mb-4"
          />
          <MarkdownTextField
            value={newContent}
            onChange={setNewContent}
            placeholder="# Document Title, write context in Markdown..."
            rows={12}
            textareaClassName="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />
          <div className="flex items-center justify-end mt-4 gap-3">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || !newContent.trim() || saving}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "Saving..." : "Save Document"}
            </button>
          </div>
        </div>
      )}

      {/* Documents list */}
      <div className="space-y-3">
        {docs.map((d) => (
          <div key={d.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
            {editingId === d.id ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <MarkdownTextField
                      multiline={false}
                      compactToolbar
                      value={editTitle}
                      onChange={setEditTitle}
                      textareaClassName="font-bold text-lg bg-transparent border-b-2 border-primary focus:outline-none w-full"
                    />
                  </div>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "active" | "draft")}
                    className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <MarkdownTextField
                  value={editContent}
                  onChange={setEditContent}
                  rows={16}
                  textareaClassName="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    {d.autoSync && (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        <span className="material-symbols-outlined text-xs">sync</span>
                        Auto-synced from CMS
                      </span>
                    )}
                    <span>{Math.round(new Blob([editContent]).size / 1024 * 10) / 10} KB</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={cancelEdit} className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !editContent.trim()}
                      className="bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 flex items-center gap-4">
                <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">description</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">{d.title}</span>
                    {d.autoSync && (
                      <span className="material-symbols-outlined text-blue-500 text-xs" title="Auto-synced from CMS">sync</span>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {Math.round(new Blob([d.content || ""]).size / 1024 * 10) / 10} KB &middot; {formatDate(d.updatedAt)}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    d.status === "active"
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                  onClick={() => handleToggleStatus(d)}
                  title="Click to toggle status"
                >
                  {d.status}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(d)}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  {deleteConfirm === d.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 bg-surface-container-high rounded-lg text-xs font-bold hover:bg-surface-container-highest transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(d.id)}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {docs.length === 0 && !showCreate && (
        <div className="text-center py-20 text-on-surface-variant/50">
          <span className="material-symbols-outlined text-5xl mb-4 block">description</span>
          <p className="text-sm font-bold uppercase tracking-widest mb-2">No context documents yet</p>
          <p className="text-xs">Create your first document or save CMS content to auto-generate context.</p>
        </div>
      )}

      <div className="mt-6 bg-surface-container-low rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-lg flex-shrink-0 mt-0.5">info</span>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Context documents are loaded into the AI&apos;s system prompt on each conversation.
          Documents marked <strong>Active</strong> are included; <strong>Draft</strong> documents are excluded.
          Documents with the <span className="material-symbols-outlined text-xs align-middle">sync</span> icon are auto-synced from CMS content.
        </p>
      </div>
    </div>
  );
}
