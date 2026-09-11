import { providerById, roleById, type AiProvider } from "@/lib/providers";

const MAX_TOKENS = 700;
const TIMEOUT_MS = 40_000;

export async function callSeatedModel(opts: {
  providerId: string;
  apiKey: string;
  role: string;
  question: string;
  prior?: { name: string; role: string; content: string }[];
  synthesize?: boolean;
}): Promise<{ text: string }> {
  const provider = providerById(opts.providerId);
  if (!provider) throw new Error("Unknown provider");
  const role = roleById(opts.role);
  const system = buildSystem(provider, role?.brief ?? opts.role, opts.synthesize);
  const user = buildUser(opts.question, opts.prior, opts.synthesize);

  if (provider.kind === "anthropic") {
    return callAnthropic(provider, opts.apiKey, system, user);
  }
  if (provider.kind === "gemini") {
    return callGemini(provider, opts.apiKey, system, user);
  }
  return callOpenAiCompat(provider, opts.apiKey, system, user);
}

function buildSystem(
  provider: AiProvider,
  roleBrief: string,
  synthesize?: boolean,
) {
  const chair = synthesize
    ? "You are the Chair. After the other seats have spoken, close the loop. Name agreement, name dissent, and give one recommended next move. Do not restate every speech."
    : `You are seated at a private roundtable as ${provider.name} (${provider.vendor}). ${roleBrief}`;
  return `${chair}

Rules:
- Speak in first person as this seat only. Do not impersonate other models.
- Be concrete. Prefer a decision, a number, a risk, or a next action over a lecture.
- Keep it under 280 words.
- If you lack facts, say so instead of inventing filings, case law, or prices.`;
}

function buildUser(
  question: string,
  prior?: { name: string; role: string; content: string }[],
  synthesize?: boolean,
) {
  let body = `Question on the table:\n${question}`;
  if (prior && prior.length > 0) {
    body += `\n\n${synthesize ? "Voices already heard:" : "Other seats so far:"}`;
    for (const p of prior) {
      body += `\n\n[${p.name} · ${p.role}]\n${p.content}`;
    }
  }
  return body;
}

async function callOpenAiCompat(
  provider: AiProvider,
  apiKey: string,
  system: string,
  user: string,
) {
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.5,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(await friendlyError(provider.name, res));
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${provider.name} returned an empty answer`);
  return { text };
}

async function callAnthropic(
  provider: AiProvider,
  apiKey: string,
  system: string,
  user: string,
) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(await friendlyError(provider.name, res));
  }
  const body = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = body.content
    ?.filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n")
    .trim();
  if (!text) throw new Error(`${provider.name} returned an empty answer`);
  return { text };
}

async function callGemini(
  provider: AiProvider,
  apiKey: string,
  system: string,
  user: string,
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.5 },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(await friendlyError(provider.name, res));
  }
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = body.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error(`${provider.name} returned an empty answer`);
  return { text };
}

async function friendlyError(name: string, res: Response) {
  const raw = await res.text();
  let detail = "";
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string };
      message?: string;
    };
    detail = parsed.error?.message ?? parsed.message ?? "";
  } catch {
    detail = raw.slice(0, 180);
  }
  if (res.status === 401 || res.status === 403) {
    return `${name} rejected the API key (${res.status}). Check Keys.`;
  }
  if (res.status === 429) {
    return `${name} rate-limited this key. Wait and try again.`;
  }
  return `${name} error ${res.status}${detail ? `: ${detail}` : ""}`;
}
