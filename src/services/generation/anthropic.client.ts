import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";
import { AppError } from "../../middleware/errorHandler";

export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/**
 * Models per generation stage. Centralised so we can A/B a stronger model on the
 * passage (the highest-leverage artifact) without touching call sites — see A6.
 */
export const MODELS = {
  passage: "claude-haiku-4-5-20251001",
  questions: "claude-haiku-4-5-20251001",
  review: "claude-haiku-4-5-20251001",
  summary: "claude-haiku-4-5-20251001",
  validator: "claude-haiku-4-5-20251001",
} as const;

/** A tool definition as loaded from a *.tool.json config file. */
export interface ToolSchema {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

interface ToolCallParams {
  model: string;
  maxTokens: number;
  system: string;
  user: string;
  tool: ToolSchema;
  /** Prompt-cache the system + user blocks (default true). */
  cache?: boolean;
}

/**
 * Forced tool-use call. The model MUST respond by calling `tool`, so the returned
 * `input` is already a structured, schema-shaped object — no markdown stripping,
 * no JSON.parse, no try/catch. Replaces the fragile text-parsing path.
 */
export async function callTool<T>({
  model,
  maxTokens,
  system,
  user,
  tool,
  cache = true,
}: ToolCallParams): Promise<T> {
  const cacheControl = cache
    ? ({ cache_control: { type: "ephemeral" } } as const)
    : {};

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    tools: [tool as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: tool.name },
    system: [{ type: "text", text: system, ...cacheControl }],
    messages: [
      { role: "user", content: [{ type: "text", text: user, ...cacheControl }] },
    ],
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new AppError(500, `Model did not return ${tool.name} output — please retry`);
  }

  return block.input as T;
}
