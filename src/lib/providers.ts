export type ProviderKind = "openai" | "anthropic" | "gemini";

export type AiProvider = {
  id: string;
  name: string;
  vendor: string;
  model: string;
  kind: ProviderKind;
  baseUrl?: string;
  docs: string;
  keyHint: string;
};

export const AI_PROVIDERS: readonly AiProvider[] = [
  {
    id: "xai",
    name: "Grok",
    vendor: "xAI",
    model: "grok-4.5",
    kind: "openai",
    baseUrl: "https://api.x.ai/v1",
    docs: "https://console.x.ai",
    keyHint: "Starts with xai-",
  },
  {
    id: "openai",
    name: "GPT",
    vendor: "OpenAI",
    model: "gpt-4o",
    kind: "openai",
    baseUrl: "https://api.openai.com/v1",
    docs: "https://platform.openai.com/api-keys",
    keyHint: "Starts with sk-",
  },
  {
    id: "anthropic",
    name: "Claude",
    vendor: "Anthropic",
    model: "claude-sonnet-4-5",
    kind: "anthropic",
    docs: "https://console.anthropic.com/settings/keys",
    keyHint: "Starts with sk-ant-",
  },
  {
    id: "google",
    name: "Gemini",
    vendor: "Google",
    model: "gemini-2.0-flash",
    kind: "gemini",
    docs: "https://aistudio.google.com/apikey",
    keyHint: "Google AI Studio key",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    vendor: "DeepSeek",
    model: "deepseek-chat",
    kind: "openai",
    baseUrl: "https://api.deepseek.com",
    docs: "https://platform.deepseek.com/api_keys",
    keyHint: "Starts with sk-",
  },
  {
    id: "groq",
    name: "Llama",
    vendor: "Groq",
    model: "llama-3.3-70b-versatile",
    kind: "openai",
    baseUrl: "https://api.groq.com/openai/v1",
    docs: "https://console.groq.com/keys",
    keyHint: "Starts with gsk_",
  },
] as const;

export const SEAT_ROLES = [
  {
    id: "chair",
    label: "Chair",
    brief:
      "Close the loop. Weigh the other voices. Give a clear recommendation, name the dissent, and state the next move.",
  },
  {
    id: "counsel",
    label: "Counsel",
    brief:
      "Legal, risk, contracts, and compliance. Flag what can get someone sued, fined, or locked out.",
  },
  {
    id: "engineer",
    label: "Engineer",
    brief:
      "Feasibility, architecture, failure modes, and the shortest path that actually ships.",
  },
  {
    id: "skeptic",
    label: "Skeptic",
    brief:
      "Attack the plan. Find the hole, the vanity metric, the thing everyone is politely ignoring.",
  },
  {
    id: "strategist",
    label: "Strategist",
    brief:
      "Positioning, timing, leverage, and who actually wins if this works.",
  },
  {
    id: "operator",
    label: "Operator",
    brief:
      "Execution. People, money, calendar, and what happens next week — not next year.",
  },
] as const;

export type SeatRoleId = (typeof SEAT_ROLES)[number]["id"];

export function providerById(id: string) {
  return AI_PROVIDERS.find((p) => p.id === id);
}

export function roleById(id: string) {
  return SEAT_ROLES.find((r) => r.id === id);
}
