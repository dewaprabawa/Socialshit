"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  platform: string;
  name: string;
  handle: string | null;
  sandbox: boolean;
}

type Platform = "instagram" | "facebook";
type Tone = "friendly" | "professional" | "playful" | "bold" | "inspirational";

const TONES: Tone[] = [
  "friendly",
  "professional",
  "playful",
  "bold",
  "inspirational",
];

export default function StudioPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");

  const [topic, setTopic] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tone, setTone] = useState<Tone>("friendly");
  const [emojis, setEmojis] = useState(true);

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [source, setSource] = useState<string>("");

  const [genLoading, setGenLoading] = useState(false);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [canvaLoading, setCanvaLoading] = useState(false);
  const [canvaEdit, setCanvaEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState<null | "draft" | "publish" | "schedule">(
    null
  );
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.text())
      .then((text) => {
        if (!text) return;
        const d = JSON.parse(text) as { accounts?: Account[] };
        setAccounts(d.accounts || []);
        if (d.accounts?.length) {
          setAccountId(d.accounts[0].id);
          if (
            d.accounts[0].platform === "facebook" ||
            d.accounts[0].platform === "instagram"
          ) {
            setPlatform(d.accounts[0].platform);
          }
        }
      })
      .catch(() => {});
  }, []);

  async function generateCaption() {
    if (!topic.trim()) {
      setMessage({ type: "err", text: "Enter a topic first." });
      return;
    }
    setGenLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/generate/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platform,
          tone,
          brand,
          audience,
          emojis,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setCaption(data.caption);
      setHashtags((data.hashtags || []).join(" "));
      setSource(data.source);
    } catch (e) {
      setMessage({ type: "err", text: (e as Error).message });
    } finally {
      setGenLoading(false);
    }
  }

  async function generateIdeas() {
    if (!topic.trim()) {
      setMessage({ type: "err", text: "Enter a topic first." });
      return;
    }
    setIdeaLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/generate/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setIdeas(data.ideas || []);
    } catch (e) {
      setMessage({ type: "err", text: (e as Error).message });
    } finally {
      setIdeaLoading(false);
    }
  }

  async function generateImageForPost() {
    const prompt = topic || caption;
    if (!prompt.trim()) {
      setMessage({ type: "err", text: "Enter a topic first." });
      return;
    }
    setImgLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${prompt}. Social media marketing image, ${tone} tone.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed");
      setMediaUrl(data.url);
    } catch (e) {
      setMessage({ type: "err", text: (e as Error).message });
    } finally {
      setImgLoading(false);
    }
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMediaUrl(data.url);
      setCanvaEdit(null);
    } catch (e) {
      setMessage({ type: "err", text: (e as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function designWithCanva() {
    const source = caption || topic;
    if (!source.trim()) {
      setMessage({ type: "err", text: "Add a caption or topic first." });
      return;
    }
    setCanvaLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/canva/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: source,
          topic,
          imageUrl: mediaUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Canva design failed");
      setMediaUrl(data.imageUrl);
      setCanvaEdit(data.editUrl || null);
      setMessage({
        type: "ok",
        text:
          data.source === "canva"
            ? "Design created in Canva and imported."
            : "Created a Canva-style design (sandbox). Connect Canva for live designs.",
      });
    } catch (e) {
      setMessage({ type: "err", text: (e as Error).message });
    } finally {
      setCanvaLoading(false);
    }
  }

  async function savePost(kind: "draft" | "publish" | "schedule") {
    if (!accountId) {
      setMessage({ type: "err", text: "Connect and select an account first." });
      return;
    }
    if (!caption.trim()) {
      setMessage({ type: "err", text: "Generate or write a caption first." });
      return;
    }
    if (kind === "schedule" && !scheduledAt) {
      setMessage({ type: "err", text: "Pick a schedule date/time." });
      return;
    }
    setSaving(kind);
    setMessage(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          caption,
          hashtags,
          mediaUrl: mediaUrl || null,
          aiGenerated: Boolean(source),
          scheduledAt: kind === "schedule" ? scheduledAt : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      if (kind === "publish") {
        const pub = await fetch(`/api/posts/${data.post.id}/publish`, {
          method: "POST",
        });
        const pubData = await pub.json();
        if (!pub.ok)
          throw new Error(pubData.error || "Publish failed");
        setMessage({
          type: "ok",
          text: pubData.sandbox
            ? "Published (sandbox / simulated). View it on the Posts page."
            : "Published live to your account!",
        });
      } else if (kind === "schedule") {
        setMessage({
          type: "ok",
          text: "Scheduled! It will auto-publish at the chosen time.",
        });
      } else {
        setMessage({ type: "ok", text: "Saved as draft." });
      }
      router.refresh();
    } catch (e) {
      setMessage({ type: "err", text: (e as Error).message });
    } finally {
      setSaving(null);
    }
  }

  const selected = accounts.find((a) => a.id === accountId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Studio</h1>
        <p className="mt-1 text-sm text-slate-400">
          Describe what you want to post. We&apos;ll generate a caption,
          hashtags, and an image — then publish or schedule it.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: inputs */}
        <div className="card space-y-4">
          <div>
            <label className="label">Topic / what to post about</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="e.g. Summer sale on handmade candles, 20% off this weekend"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Brand (optional)</label>
              <input
                className="input"
                placeholder="Glow Candle Co."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Audience (optional)</label>
              <input
                className="input"
                placeholder="home decor lovers"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Platform</label>
              <select
                className="input"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>
            <div>
              <label className="label">Tone</label>
              <select
                className="input"
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={emojis}
              onChange={(e) => setEmojis(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-900"
            />
            Include emojis
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary"
              onClick={generateCaption}
              disabled={genLoading}
            >
              {genLoading ? "Generating…" : "Generate caption"}
            </button>
            <button
              className="btn-ghost"
              onClick={generateIdeas}
              disabled={ideaLoading}
            >
              {ideaLoading ? "Thinking…" : "Suggest ideas"}
            </button>
            <button
              className="btn-ghost"
              onClick={generateImageForPost}
              disabled={imgLoading}
            >
              {imgLoading ? "Rendering…" : "Generate image"}
            </button>
            <button
              className="btn-ghost"
              onClick={designWithCanva}
              disabled={canvaLoading}
              title="Create an editable design in Canva from your content"
            >
              {canvaLoading ? "Designing…" : "Design with Canva"}
            </button>
          </div>

          {ideas.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Post ideas
              </div>
              <ul className="space-y-1.5">
                {ideas.map((idea, i) => (
                  <li key={i}>
                    <button
                      className="text-left text-sm text-slate-300 hover:text-brand-300"
                      onClick={() => setTopic(idea)}
                    >
                      • {idea}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: preview + publish */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Caption</label>
            {source && (
              <span className="badge bg-brand-500/20 text-brand-300">
                {source === "openai" ? "OpenAI" : "Template engine"}
              </span>
            )}
          </div>
          <textarea
            className="input min-h-[120px]"
            placeholder="Your generated caption will appear here — edit freely."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          <div>
            <label className="label">Hashtags</label>
            <input
              className="input"
              placeholder="#marketing #smallbusiness"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label mb-0">Image</label>
              <label
                className={`cursor-pointer text-xs font-medium text-brand-400 hover:underline ${
                  uploading ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {uploading ? "Uploading…" : "Upload a file"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            <input
              className="input mt-1"
              placeholder="Paste an image URL, upload a file, or generate one"
              value={mediaUrl.startsWith("data:") ? "(generated design)" : mediaUrl}
              onChange={(e) => {
                setMediaUrl(e.target.value);
                setCanvaEdit(null);
              }}
              readOnly={mediaUrl.startsWith("data:")}
            />
            {mediaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt="preview"
                className="mt-2 h-40 w-full rounded-lg object-cover"
              />
            )}
            {canvaEdit && (
              <a
                href={canvaEdit}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-xs font-medium text-brand-400 hover:underline"
              >
                Edit this design in Canva ↗
              </a>
            )}
          </div>

          <div className="border-t border-white/10 pt-4">
            <label className="label">Publish to</label>
            {accounts.length === 0 ? (
              <p className="text-sm text-amber-300">
                No accounts yet. Add one on the Accounts page.
              </p>
            ) : (
              <select
                className="input"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.platform === "instagram" ? "IG" : "FB"} · {a.name}
                    {a.sandbox ? " (sandbox)" : ""}
                  </option>
                ))}
              </select>
            )}
            {selected?.sandbox && (
              <p className="mt-1 text-xs text-amber-400/80">
                This account is in sandbox mode — publishing is simulated.
              </p>
            )}
          </div>

          <div>
            <label className="label">Schedule for (optional)</label>
            <input
              type="datetime-local"
              className="input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary"
              onClick={() => savePost("publish")}
              disabled={saving !== null}
            >
              {saving === "publish" ? "Publishing…" : "Publish now"}
            </button>
            <button
              className="btn-ghost"
              onClick={() => savePost("schedule")}
              disabled={saving !== null}
            >
              {saving === "schedule" ? "Scheduling…" : "Schedule"}
            </button>
            <button
              className="btn-ghost"
              onClick={() => savePost("draft")}
              disabled={saving !== null}
            >
              {saving === "draft" ? "Saving…" : "Save draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
