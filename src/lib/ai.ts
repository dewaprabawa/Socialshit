import OpenAI from "openai";

export type Platform = "instagram" | "facebook";
export type Tone =
  | "friendly"
  | "professional"
  | "playful"
  | "bold"
  | "inspirational";

export interface CaptionRequest {
  topic: string;
  platform: Platform;
  tone?: Tone;
  brand?: string;
  audience?: string;
  emojis?: boolean;
  hashtagCount?: number;
}

export interface CaptionResult {
  caption: string;
  hashtags: string[];
  source: "openai" | "fallback";
}

export interface ContentIdeaResult {
  ideas: string[];
  source: "openai" | "fallback";
}

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const TONE_WORDS: Record<Tone, string[]> = {
  friendly: ["love", "hey friends", "so good", "come hang", "warm"],
  professional: ["introducing", "proud to share", "designed for", "results"],
  playful: ["okay but", "plot twist", "obsessed", "no thoughts just", "vibes"],
  bold: ["stop scrolling", "this changes everything", "go big", "own it"],
  inspirational: ["dream bigger", "start today", "your moment", "keep going"],
};

function pick<T>(arr: T[], n = 1): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function slugWords(topic: string): string[] {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function fallbackCaption(req: CaptionRequest): CaptionResult {
  const tone = req.tone ?? "friendly";
  const opener = pick(TONE_WORDS[tone])[0];
  const emoji = req.emojis === false ? "" : " \u2728";
  const brandTag = req.brand ? `${req.brand}: ` : "";
  const audience = req.audience ? ` for ${req.audience}` : "";

  const caption =
    `${brandTag}${capitalize(opener)} \u2014 ${req.topic}${audience}.` +
    ` Here's why it matters and how to make it yours today.${emoji}` +
    (req.platform === "instagram"
      ? " Save this & share with a friend."
      : " Tell us what you think in the comments.");

  const base = slugWords(`${req.brand ?? ""} ${req.topic}`);
  const extras = [
    "marketing",
    "socialmedia",
    "smallbusiness",
    "contentcreation",
    req.platform,
  ];
  const count = req.hashtagCount ?? (req.platform === "instagram" ? 8 : 3);
  const tags = Array.from(new Set([...base, ...extras]))
    .slice(0, count)
    .map((t) => `#${t.replace(/[^a-z0-9]/g, "")}`)
    .filter((t) => t.length > 1);

  return { caption, hashtags: tags, source: "fallback" };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function generateCaption(
  req: CaptionRequest
): Promise<CaptionResult> {
  const client = getClient();
  if (!client) return fallbackCaption(req);

  const model = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
  const hashtagCount = req.hashtagCount ?? (req.platform === "instagram" ? 8 : 3);

  const prompt =
    `Write a ${req.tone ?? "friendly"} ${req.platform} caption for this topic: "${req.topic}".` +
    (req.brand ? ` Brand: ${req.brand}.` : "") +
    (req.audience ? ` Target audience: ${req.audience}.` : "") +
    (req.emojis === false ? " Do not use emojis." : " Use a few tasteful emojis.") +
    ` Then provide exactly ${hashtagCount} relevant hashtags.` +
    ` Respond as strict JSON: {"caption": string, "hashtags": string[]}. Hashtags must include the leading # and contain no spaces.`;

  try {
    const res = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert social media marketer. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    });
    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      caption?: string;
      hashtags?: string[];
    };
    return {
      caption: parsed.caption?.trim() || fallbackCaption(req).caption,
      hashtags: (parsed.hashtags ?? [])
        .map((h) => (h.startsWith("#") ? h : `#${h}`))
        .filter(Boolean),
      source: "openai",
    };
  } catch (err) {
    console.error("OpenAI caption generation failed, using fallback:", err);
    return fallbackCaption(req);
  }
}

export async function generateContentIdeas(
  topic: string,
  platform: Platform,
  count = 5
): Promise<ContentIdeaResult> {
  const client = getClient();
  if (!client) {
    const angles = [
      `Behind the scenes of ${topic}`,
      `A quick tip about ${topic}`,
      `Common myth about ${topic} (debunked)`,
      `Before / after with ${topic}`,
      `Customer story featuring ${topic}`,
      `${capitalize(topic)} checklist your audience can save`,
    ];
    return { ideas: angles.slice(0, count), source: "fallback" };
  }

  const model = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
  try {
    const res = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a social content strategist. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Give ${count} distinct ${platform} post ideas about "${topic}". Respond as JSON: {"ideas": string[]}.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    });
    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { ideas?: string[] };
    return { ideas: parsed.ideas ?? [], source: "openai" };
  } catch (err) {
    console.error("OpenAI idea generation failed, using fallback:", err);
    return generateContentIdeas(topic, platform, count);
  }
}

export interface ImageResult {
  url: string;
  source: "openai" | "fallback";
}

// Deterministic, dependency-free placeholder image so the media pipeline can be
// demonstrated without image-generation credentials.
function fallbackImage(prompt: string): ImageResult {
  const seed = encodeURIComponent(prompt.slice(0, 40) || "socialshit");
  return {
    url: `https://picsum.photos/seed/${seed}/1080/1080`,
    source: "fallback",
  };
}

export async function generateImage(prompt: string): Promise<ImageResult> {
  const client = getClient();
  if (!client) return fallbackImage(prompt);

  const model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
  try {
    const res = await client.images.generate({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
    });
    const url = res.data?.[0]?.url;
    if (!url) return fallbackImage(prompt);
    return { url, source: "openai" };
  } catch (err) {
    console.error("OpenAI image generation failed, using fallback:", err);
    return fallbackImage(prompt);
  }
}
