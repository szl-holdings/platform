import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSituationRooms, createSituationRoom, updateSituationRoom,
  addRoomNote, deleteRoomNote, handoffSituationRoom
} from "@/lib/api";
import { useNexusSettings } from "@/lib/SettingsContext";
import { cn, formatTimeAgo } from "@/lib/utils";
import {
  Plus, Shield, Users, MessageSquare, Trash2, Loader2, AlertCircle, ArrowRightLeft
} from "lucide-react";

interface SituationRoom {
  id: string;
  name: string;
  description: string;
  status: "active" | "resolved" | "archived" | "escalated";
  priority: "P0" | "P1" | "P2" | "P3";
  operators: string[];
  entities: string[];
  domains: string[];
  notes: RoomNote[];
  createdAt: string;
  updatedAt: string;
  tag: string;
}

interface RoomNote {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "hsl(206,72%,52%)", aegis: "hsl(222,60%,62%)", terra: "hsl(140,50%,48%)",
  prism: "hsl(38,72%,58%)", lyte: "hsl(192,85%,46%)",
};


const PRIORITY_COLORS: Record<string, string> = {
  P0: "hsl(0,72%,51%)", P1: "hsl(32,88%,52%)", P2: "hsl(45,85%,52%)", P3: "hsl(160,65%,42%)",
};

export default function SituationRooms() {
  const { refetchIntervalMs } = useNexusSettings();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [showHandoff, setShowHandoff] = useState(false);
  const [handoffInput, setHandoffInput] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["situation-rooms"],
    queryFn: fetchSituationRooms,
    refetchInterval: refetchIntervalMs,
  });

  const rooms: SituationRoom[] = data?.rooms ?? [];
  const selectedRoom = rooms.find(r => r.id === selectedId) ?? null;

  // Auto-select first room after data loads — use useEffect to avoid render-time state update
  useEffect(() => {
    if (!selectedId && rooms.length > 0) {
      setSelectedId(rooms[0].id);
    }
  }, [rooms, selectedId]);

  const addNoteMutation = useMutation({
    mutationFn: ({ content }: { content: string }) => addRoomNote(selectedId!, content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["situation-rooms"] }); setNewNote(""); },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: ({ roomId, noteId }: { roomId: string; noteId: string }) => deleteRoomNote(roomId, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["situation-rooms"] }),
  });

  const createRoomMutation = useMutation({
    mutationFn: () => createSituationRoom({ name: newRoomName.trim(), description: newRoomDesc.trim(), tag: "investigation" }),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ["situation-rooms"] });
      setSelectedId(room.id);
      setNewRoomName(""); setNewRoomDesc(""); setShowCreate(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: string }) => updateSituationRoom(roomId, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["situation-rooms"] }),
  });

  const handoffMutation = useMutation({
    mutationFn: ({ roomId, assignTo }: { roomId: string; assignTo: string[] }) =>
      handoffSituationRoom(roomId, { assignTo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["situation-rooms"] });
      setShowHandoff(false);
      setHandoffInput("");
    },
  });

  const addNote = () => {
    if (!newNote.trim() || !selectedId) return;
    addNoteMutation.mutate({ content: newNote });
  };

  const filtered = rooms.filter(r => !statusFilter || r.status === statusFilter);

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center flex-col gap-2 text-muted-foreground">
      <AlertCircle className="w-6 h-6 text-red-500" />
      <p className="text-sm">Failed to load situation rooms</p>
    </div>
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Room list */}
      <div className="w-72 border-r border-border flex flex-col overflow-hidden bg-[hsl(226_24%_4%)]">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div>
            <h1 className="text-sm font-display font-bold text-foreground">Situation Rooms</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">{filtered.length} rooms</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-xs px-2 py-1 rounded border border-[hsla(258,80%,62%,0.4)] text-[hsl(258_80%_72%)] hover:bg-[hsla(258,80%,62%,0.08)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Create room */}
        {showCreate && (
          <div className="p-3 border-b border-border bg-card animate-fade-in space-y-2">
            <input
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder="Room name..."
              className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[hsl(258_80%_62%)]"
            />
            <textarea
              value={newRoomDesc}
              onChange={e => setNewRoomDesc(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[hsl(258_80%_62%)] resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => createRoomMutation.mutate()}
                disabled={!newRoomName.trim() || createRoomMutation.isPending}
                className="flex-1 text-xs py-1 rounded bg-[hsl(258_80%_62%)] text-white hover:bg-[hsl(258_80%_55%)] transition-colors font-medium disabled:opacity-40"
              >
                {createRoomMutation.isPending ? "Creating..." : "Create"}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-3 text-xs py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="px-3 py-2 border-b border-border">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-background border border-border text-foreground rounded px-2 py-1 focus:outline-none"
          >
            <option value="">All Rooms</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {filtered.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedId(room.id)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-border/50 transition-colors",
                selectedId === room.id ? "bg-[hsla(258,80%,62%,0.08)]" : "hover:bg-[hsl(228_20%_6%)]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-mono font-bold" style={{ color: PRIORITY_COLORS[room.priority] }}>
                      {room.priority}
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      {room.tag}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-foreground leading-snug line-clamp-1">{room.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {room.operators.length} ops · {room.notes.length} notes · {formatTimeAgo(room.updatedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  {room.domains.slice(0, 3).map(d => (
                    <div key={d} className="w-2 h-2 rounded-full" style={{ background: DOMAIN_COLORS[d] }} />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Room detail */}
      {selectedRoom ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Room header */}
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold" style={{ color: PRIORITY_COLORS[selectedRoom.priority] }}>
                    {selectedRoom.priority}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-mono",
                    selectedRoom.status === "active" ? "bg-[hsla(140,50%,48%,0.1)] text-[hsl(140,50%,56%)] border border-[hsla(140,50%,48%,0.25)]" :
                    selectedRoom.status === "escalated" ? "bg-[hsla(0,72%,51%,0.1)] text-red-400 border border-[hsla(0,72%,51%,0.25)]" :
                    selectedRoom.status === "resolved" ? "bg-[hsla(258,80%,62%,0.1)] text-[hsl(258,80%,70%)] border border-[hsla(258,80%,62%,0.25)]" :
                    "bg-muted text-muted-foreground border border-border"
                  )}>
                    {selectedRoom.status.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-base font-display font-bold text-foreground">{selectedRoom.name}</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">{selectedRoom.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{selectedRoom.operators.join(", ")}</span>
                </div>
                <button
                  onClick={() => setShowHandoff(!showHandoff)}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-border bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title="Assign or transfer operators"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  Handoff
                </button>
              </div>

              {/* Handoff panel */}
              {showHandoff && selectedId && (
                <div className="mt-3 p-3 rounded border border-[hsla(258,80%,62%,0.25)] bg-[hsla(258,80%,62%,0.04)]">
                  <p className="text-xs font-medium text-foreground mb-2">Assign Operators</p>
                  <p className="text-[10px] text-muted-foreground mb-2">Enter operator names (comma-separated) to assign to this room.</p>
                  <div className="flex gap-2">
                    <input
                      value={handoffInput}
                      onChange={e => setHandoffInput(e.target.value)}
                      placeholder="e.g. A. Torres, K. Ng"
                      className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(258,80%,62%)]"
                    />
                    <button
                      onClick={() => {
                        const names = handoffInput.split(",").map(s => s.trim()).filter(Boolean);
                        if (names.length > 0) handoffMutation.mutate({ roomId: selectedId, assignTo: names });
                      }}
                      disabled={handoffMutation.isPending || !handoffInput.trim()}
                      className="text-[10px] px-3 py-1 rounded bg-[hsl(258,80%,62%)] text-white hover:bg-[hsl(258,80%,55%)] disabled:opacity-50 transition-colors font-medium"
                    >
                      {handoffMutation.isPending ? "Assigning..." : "Assign"}
                    </button>
                    <button
                      onClick={() => setShowHandoff(false)}
                      className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Entities + domains */}
            {selectedRoom.entities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedRoom.entities.map(ent => (
                  <span key={ent} className="text-[10px] px-2 py-0.5 rounded bg-[hsla(258,80%,62%,0.07)] border border-[hsla(258,80%,62%,0.18)] text-foreground/80 font-mono">
                    {ent}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes feed */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {selectedRoom.notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <MessageSquare className="w-6 h-6 mb-2 opacity-30" />
                <p className="text-sm">No notes yet — add the first update below</p>
              </div>
            ) : (
              selectedRoom.notes.map((note, idx) => (
                <div
                  key={note.id}
                  className={cn("fusion-panel p-4 animate-fade-in-up", `stagger-${Math.min(idx + 1, 6) as 1}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[hsl(258_80%_70%)]">{note.author}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{formatTimeAgo(note.timestamp)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{note.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Add note */}
          <div className="px-6 py-4 border-t border-border shrink-0">
            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add an intelligence note, status update, or analytic finding..."
                rows={2}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(); }}
                className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[hsl(258_80%_62%)] resize-none"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                className="px-4 rounded-lg bg-[hsl(258_80%_62%)] text-white text-sm font-medium hover:bg-[hsl(258_80%_55%)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {addNoteMutation.isPending ? "..." : "Post"}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Cmd+Enter to post</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Select a situation room to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}
