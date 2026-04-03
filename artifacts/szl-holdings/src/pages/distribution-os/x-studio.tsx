import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { Twitter, Plus, Send, Clock, CheckCircle, AlertCircle, Trash2, MessageSquare } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface XPost {
  id: number;
  body: string;
  postType: string;
  status: string;
  scheduledFor: string | null;
  sentAt: string | null;
  externalPostUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const STATUS_ICONS: Record<string, { icon: typeof Clock; color: string }> = {
  draft: { icon: Clock, color: "#8b8579" },
  queued: { icon: Send, color: "#d4a054" },
  sent: { icon: CheckCircle, color: "#5a9c5a" },
  failed: { icon: AlertCircle, color: "#c45a4a" },
};

export default function XStudioPage() {
  const [location] = useLocation();
  const [posts, setPosts] = useState<XPost[]>([]);
  const [newBody, setNewBody] = useState("");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/distribution-os/x-posts`).then(r => r.json()).then(setPosts).catch(() => {});
  }, []);

  async function createPost() {
    if (!newBody) return;
    const res = await fetch(`${API}/api/distribution-os/x-posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newBody, postType: "single" }),
    });
    const post = await res.json();
    setPosts(prev => [post, ...prev]);
    setNewBody("");
    setShowNew(false);
  }

  async function queuePost(id: number) {
    const res = await fetch(`${API}/api/distribution-os/x-posts/${id}/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const updated = await res.json();
    setPosts(prev => prev.map(p => p.id === id ? updated : p));
  }

  async function deletePost(id: number) {
    await fetch(`${API}/api/distribution-os/x-posts/${id}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  const charCount = newBody.length;
  const overLimit = charCount > 280;

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>X Studio</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Compose, queue, and manage posts for X (Twitter)</p>
          </div>
          <button onClick={() => setShowNew(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
            <Plus size={16} /> New Post
          </button>
        </div>

        {showNew && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "10px", marginBottom: "1.5rem" }}>
            <textarea
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              placeholder="What's happening?"
              rows={4}
              style={{ width: "100%", padding: "0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.9375rem", resize: "vertical", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem" }}>
              <span style={{ fontSize: "0.75rem", color: overLimit ? "#c45a4a" : "#6b6560" }}>{charCount}/280</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => { setShowNew(false); setNewBody(""); }} style={{ padding: "0.5rem 1rem", background: "hsla(0,0%,100%,0.06)", color: "#8b8579", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", fontSize: "0.8125rem", cursor: "pointer" }}>Cancel</button>
                <button onClick={createPost} disabled={overLimit || !newBody} style={{ padding: "0.5rem 1rem", background: "#d4a054", color: "#070a10", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", opacity: overLimit || !newBody ? 0.5 : 1 }}>Save Draft</button>
              </div>
            </div>
          </m.div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {posts.map(post => {
            const si = STATUS_ICONS[post.status] || STATUS_ICONS.draft;
            return (
              <div key={post.id} style={{ padding: "1rem 1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <Twitter size={18} style={{ color: "#4a90b8", flexShrink: 0, marginTop: "0.125rem" }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.875rem", color: "#e8e4de", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{post.body}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <si.icon size={12} style={{ color: si.color }} />
                        <span style={{ fontSize: "0.6875rem", color: si.color, textTransform: "uppercase", fontWeight: 600 }}>{post.status}</span>
                      </div>
                      <span style={{ fontSize: "0.6875rem", color: "#4a4540" }}>{new Date(post.createdAt).toLocaleDateString()}</span>
                      {post.errorMessage && <span style={{ fontSize: "0.6875rem", color: "#c45a4a" }}>{post.errorMessage}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    {post.status === "draft" && <button onClick={() => queuePost(post.id)} title="Queue for sending" style={{ padding: "0.375rem", background: "none", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "4px", color: "#d4a054", cursor: "pointer" }}><Send size={14} /></button>}
                    <button onClick={() => deletePost(post.id)} title="Delete" style={{ padding: "0.375rem", background: "none", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "4px", color: "#c45a4a", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
          {posts.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "#4a4540" }}>
              <MessageSquare size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
              <p>No X posts yet. Create your first post.</p>
            </div>
          )}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
