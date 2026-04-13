import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Music, Mic, Zap, Volume2, Play, Pause, Download, Share2, Plus, Clock, Waveform, Headphones, Radio, Star, RefreshCw, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type AssetType = "music" | "voice_narration" | "sound_effect" | "podcast" | "jingle" | "ambient";
type AssetStatus = "generating" | "completed" | "failed";

interface SoundAsset {
  id: string;
  title: string;
  asset_type: AssetType;
  genre?: string;
  mood?: string;
  bpm?: number;
  duration_seconds?: number;
  tags?: string[];
  file_url?: string;
  waveform_data?: number[];
  status: AssetStatus;
  campaign_id?: string;
  created_at: string;
}

const ASSET_TYPE_META: Record<AssetType, { icon: React.ReactNode; label: string; color: string }> = {
  music: { icon: <Music className="w-4 h-4" />, label: "Music", color: "text-violet-400" },
  voice_narration: { icon: <Mic className="w-4 h-4" />, label: "Voice", color: "text-blue-400" },
  sound_effect: { icon: <Zap className="w-4 h-4" />, label: "SFX", color: "text-yellow-400" },
  podcast: { icon: <Radio className="w-4 h-4" />, label: "Podcast", color: "text-emerald-400" },
  jingle: { icon: <Star className="w-4 h-4" />, label: "Jingle", color: "text-pink-400" },
  ambient: { icon: <Headphones className="w-4 h-4" />, label: "Ambient", color: "text-cyan-400" },
};

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<{ success: boolean; data: unknown }>;
}

function WaveformVisualizer({ data, playing }: { data?: number[]; playing?: boolean }) {
  const points = data?.slice(0, 80) ?? Array.from({ length: 80 }, () => Math.random() * 0.6 + 0.1);
  return (
    <div className="flex items-center gap-px h-8">
      {points.map((v, i) => (
        <div
          key={i}
          style={{ height: `${Math.max(v * 100, 4)}%` }}
          className={`w-0.5 rounded-full flex-shrink-0 transition-all duration-300 ${playing ? "bg-violet-400 animate-pulse" : "bg-violet-400/40"}`}
        />
      ))}
    </div>
  );
}

export default function SoundStudio() {
  const [activeTab, setActiveTab] = useState<"generate" | "library" | "projects" | "clones">("generate");
  const [assets, setAssets] = useState<SoundAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<AssetType | null>(null);

  const [musicForm, setMusicForm] = useState({ prompt: "", genre: "cinematic", mood: "uplifting", duration: 30 });
  const [voiceForm, setVoiceForm] = useState({ text: "", style: "narration", speed: 1.0 });
  const [sfxForm, setSfxForm] = useState({ prompt: "", duration: 5, category: "ambient" });
  const [podcastForm, setPodcastForm] = useState({ topic: "", style: "interview", duration: 300 });

  const [generationQueue, setGenerationQueue] = useState<string[]>([]);

  const loadAssets = async () => {
    try {
      const result = await apiFetch("/sound-studio/assets?limit=50");
      const data = result.data as { assets: SoundAsset[] };
      setAssets(data.assets ?? []);
    } catch { }
    finally { setLoadingAssets(false); }
  };

  useEffect(() => { loadAssets(); }, []);

  useEffect(() => {
    if (generationQueue.length === 0) return;
    const interval = setInterval(async () => {
      const stillGenerating = [];
      for (const id of generationQueue) {
        try {
          const result = await apiFetch(`/sound-studio/assets/${id}`);
          const asset = result.data as SoundAsset;
          setAssets(prev => {
            const exists = prev.some(a => a.id === id);
            if (exists) return prev.map(a => a.id === id ? asset : a);
            return [asset, ...prev];
          });
          if (asset.status === "generating") stillGenerating.push(id);
        } catch {
          stillGenerating.push(id);
        }
      }
      setGenerationQueue(stillGenerating);
    }, 3000);
    return () => clearInterval(interval);
  }, [generationQueue]);

  const generateMusic = async () => {
    if (!musicForm.prompt.trim()) return;
    setGenerating("music");
    try {
      const res = await apiFetch("/sound-studio/generate/music", {
        method: "POST",
        body: JSON.stringify(musicForm),
      });
      const data = res.data as { id: string };
      setGenerationQueue(prev => [...prev, data.id]);
      setActiveTab("library");
    } catch (err) {
      alert(`Music generation failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setGenerating(null);
    }
  };

  const generateVoice = async () => {
    if (!voiceForm.text.trim()) return;
    setGenerating("voice_narration");
    try {
      const res = await apiFetch("/sound-studio/generate/voice", {
        method: "POST",
        body: JSON.stringify(voiceForm),
      });
      const data = res.data as { id: string };
      setGenerationQueue(prev => [...prev, data.id]);
      setActiveTab("library");
    } catch (err) {
      alert(`Voice generation failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setGenerating(null);
    }
  };

  const generateSfx = async () => {
    if (!sfxForm.prompt.trim()) return;
    setGenerating("sound_effect");
    try {
      const res = await apiFetch("/sound-studio/generate/sound-effect", {
        method: "POST",
        body: JSON.stringify(sfxForm),
      });
      const data = res.data as SoundAsset;
      setAssets(prev => [data, ...prev]);
      setActiveTab("library");
    } catch (err) {
      alert(`SFX generation failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setGenerating(null);
    }
  };

  const generatePodcast = async () => {
    if (!podcastForm.topic.trim()) return;
    setGenerating("podcast");
    try {
      const res = await apiFetch("/sound-studio/generate/podcast", {
        method: "POST",
        body: JSON.stringify(podcastForm),
      });
      const data = res.data as SoundAsset;
      setAssets(prev => [data, ...prev]);
      setActiveTab("library");
    } catch (err) {
      alert(`Podcast generation failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setGenerating(null);
    }
  };

  const shareToForge = async (assetId: string) => {
    await apiFetch(`/sound-studio/assets/${assetId}/share-forge`, { method: "POST" });
    await loadAssets();
  };

  const masterAsset = async (assetId: string) => {
    await apiFetch(`/sound-studio/assets/${assetId}/master`, { method: "POST", body: JSON.stringify({ targetLoudness: -14 }) });
    await loadAssets();
  };

  const tabs = [
    { id: "generate", label: "Generate", icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "library", label: "Library", icon: <Volume2 className="w-3.5 h-3.5" /> },
    { id: "projects", label: "Projects", icon: <Music className="w-3.5 h-3.5" /> },
    { id: "clones", label: "Voice Clones", icon: <Mic className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
              <Music className="w-4.5 h-4.5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Alloy Sound Studio</h1>
              <p className="text-xs text-slate-500">AI music · voice · podcast · sound design</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {assets.filter(a => a.status === "generating").length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {assets.filter(a => a.status === "generating").length} generating
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-1 mb-6 bg-white/2 p-1 rounded-xl w-fit border border-white/5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === tab.id ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "generate" && (
          <div className="grid grid-cols-2 gap-5">
            <GeneratorCard title="AI Music" icon={<Music className="w-5 h-5 text-violet-400" />} color="violet">
              <div className="space-y-3">
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-400 placeholder:text-slate-600"
                  rows={3}
                  placeholder="Describe the music... e.g. 'Epic orchestral score with rising strings for a product launch'"
                  value={musicForm.prompt}
                  onChange={e => setMusicForm(p => ({ ...p, prompt: e.target.value }))}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Genre</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs"
                      value={musicForm.genre}
                      onChange={e => setMusicForm(p => ({ ...p, genre: e.target.value }))}
                    >
                      {["cinematic", "electronic", "jazz", "ambient", "hip-hop", "classical", "pop", "rock", "lo-fi"].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Mood</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs"
                      value={musicForm.mood}
                      onChange={e => setMusicForm(p => ({ ...p, mood: e.target.value }))}
                    >
                      {["uplifting", "tense", "melancholic", "energetic", "calm", "mysterious", "triumphant"].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Duration (s)</label>
                    <input
                      type="number"
                      min={5}
                      max={300}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs"
                      value={musicForm.duration}
                      onChange={e => setMusicForm(p => ({ ...p, duration: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <button
                  onClick={generateMusic}
                  disabled={generating !== null || !musicForm.prompt.trim()}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating === "music" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {generating === "music" ? "Generating..." : "Generate Music"}
                </button>
              </div>
            </GeneratorCard>

            <GeneratorCard title="AI Voice & Narration" icon={<Mic className="w-5 h-5 text-blue-400" />} color="blue">
              <div className="space-y-3">
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400 placeholder:text-slate-600"
                  rows={4}
                  placeholder="Enter the text to synthesize..."
                  value={voiceForm.text}
                  onChange={e => setVoiceForm(p => ({ ...p, text: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Style</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs"
                      value={voiceForm.style}
                      onChange={e => setVoiceForm(p => ({ ...p, style: e.target.value }))}
                    >
                      {["narration", "conversational", "news", "promotional", "documentary", "podcast"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Speed</label>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full mt-2"
                      value={voiceForm.speed}
                      onChange={e => setVoiceForm(p => ({ ...p, speed: parseFloat(e.target.value) }))}
                    />
                    <div className="text-[10px] text-slate-500 text-center">{voiceForm.speed}x</div>
                  </div>
                </div>
                <button
                  onClick={generateVoice}
                  disabled={generating !== null || !voiceForm.text.trim()}
                  className="w-full py-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating === "voice_narration" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                  {generating === "voice_narration" ? "Generating..." : "Synthesize Voice"}
                </button>
              </div>
            </GeneratorCard>

            <GeneratorCard title="Sound Effects" icon={<Zap className="w-5 h-5 text-yellow-400" />} color="yellow">
              <div className="space-y-3">
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 placeholder:text-slate-600"
                  placeholder="Describe the sound effect... e.g. 'thunderclap with rain'"
                  value={sfxForm.prompt}
                  onChange={e => setSfxForm(p => ({ ...p, prompt: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Category</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs"
                      value={sfxForm.category}
                      onChange={e => setSfxForm(p => ({ ...p, category: e.target.value }))}
                    >
                      {["ambient", "nature", "mechanical", "human", "electronic", "impact", "transition"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Duration (s)</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs"
                      value={sfxForm.duration}
                      onChange={e => setSfxForm(p => ({ ...p, duration: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <button
                  onClick={generateSfx}
                  disabled={generating !== null || !sfxForm.prompt.trim()}
                  className="w-full py-2 bg-yellow-600/60 hover:bg-yellow-600/80 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating === "sound_effect" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {generating === "sound_effect" ? "Generating..." : "Generate SFX"}
                </button>
              </div>
            </GeneratorCard>

            <GeneratorCard title="AI Podcast" icon={<Radio className="w-5 h-5 text-emerald-400" />} color="emerald">
              <div className="space-y-3">
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 placeholder:text-slate-600"
                  placeholder="Podcast topic... e.g. 'The future of AI in healthcare'"
                  value={podcastForm.topic}
                  onChange={e => setPodcastForm(p => ({ ...p, topic: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Style</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs"
                      value={podcastForm.style}
                      onChange={e => setPodcastForm(p => ({ ...p, style: e.target.value }))}
                    >
                      {["interview", "monologue", "debate", "storytelling", "educational", "panel"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Duration (s)</label>
                    <input
                      type="number"
                      min={60}
                      max={3600}
                      step={60}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs"
                      value={podcastForm.duration}
                      onChange={e => setPodcastForm(p => ({ ...p, duration: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <button
                  onClick={generatePodcast}
                  disabled={generating !== null || !podcastForm.topic.trim()}
                  className="w-full py-2 bg-emerald-600/60 hover:bg-emerald-600/80 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating === "podcast" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                  {generating === "podcast" ? "Generating..." : "Generate Podcast"}
                </button>
              </div>
            </GeneratorCard>
          </div>
        )}

        {activeTab === "library" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Audio Asset Library</h2>
              <button onClick={loadAssets} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            {loadingAssets ? (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">Loading assets...</div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                <Volume2 className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No audio assets yet — generate some first</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {assets.map(asset => {
                  const meta = ASSET_TYPE_META[asset.asset_type] ?? ASSET_TYPE_META.music;
                  const isPlaying = playingId === asset.id;
                  return (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 transition-colors group"
                    >
                      <button
                        onClick={() => setPlayingId(isPlaying ? null : (asset.status === "completed" ? asset.id : null))}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${asset.status === "completed" ? "border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 cursor-pointer" : "border-white/10 opacity-40 cursor-not-allowed"}`}
                      >
                        {asset.status === "generating" ? (
                          <RefreshCw className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-3.5 h-3.5 text-violet-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-violet-400 ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={meta.color}>{meta.icon}</span>
                          <span className="text-sm font-medium text-white truncate">{asset.title}</span>
                          {asset.status === "generating" && (
                            <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full animate-pulse">generating</span>
                          )}
                        </div>
                        <WaveformVisualizer data={asset.waveform_data} playing={isPlaying} />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                        {asset.bpm && <span>{asset.bpm} BPM</span>}
                        {asset.duration_seconds && <span><Clock className="w-3 h-3 inline mr-0.5" />{Math.floor(asset.duration_seconds)}s</span>}
                        {asset.genre && <span className="px-1.5 py-0.5 bg-white/5 rounded">{asset.genre}</span>}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => masterAsset(asset.id)}
                          title="AI Master"
                          className="p-1.5 hover:bg-violet-500/10 rounded-lg transition-colors text-slate-400 hover:text-violet-400"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => shareToForge(asset.id)}
                          title="Share to Forge"
                          className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors text-slate-400 hover:text-blue-400"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Download"
                          className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors text-slate-400 hover:text-emerald-400"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "projects" && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Music className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium mb-1">Multi-Track Projects</p>
            <p className="text-xs text-center max-w-sm">Create multi-track mixing projects to layer music, voice, and sound effects together.</p>
          </div>
        )}

        {activeTab === "clones" && (
          <VoiceCloneTab />
        )}
      </div>
    </div>
  );
}

function GeneratorCard({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className={`p-4 rounded-2xl border bg-gradient-to-br from-${color}-500/5 to-transparent border-${color}-500/10`}>
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function VoiceCloneTab() {
  const [clones, setClones] = useState<Array<{ id: string; name: string; status: string; sample_count: number }>>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    apiFetch("/sound-studio/voice-clones")
      .then(r => setClones(((r.data as { voiceClones: typeof clones }).voiceClones) ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-blue-500/10 bg-blue-500/5">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Mic className="w-4 h-4 text-blue-400" /> Clone a Voice
        </h3>
        <div className="space-y-3">
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder:text-slate-600"
            placeholder="Voice clone name (e.g. CEO Voice, Brand Ambassador)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-white/10 text-center">
            <Upload className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <p className="text-xs text-slate-500">Upload 3+ voice sample files (MP3, WAV) for training. Minimum 30 seconds of clean audio per sample.</p>
          </div>
          <p className="text-xs text-slate-600">Powered by ElevenLabs voice cloning. Samples are processed securely and used only for this voice profile.</p>
        </div>
      </div>

      {clones.length > 0 && (
        <div className="space-y-2">
          {clones.map(clone => (
            <div key={clone.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{clone.name}</p>
                  <p className="text-xs text-slate-500">{clone.sample_count} samples · {clone.status}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${clone.status === "ready" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                {clone.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
