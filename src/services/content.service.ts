/**
 * Backward-compatible facade for the generation pipeline.
 *
 * The implementation was split out of this former 1,100-line god file into the
 * staged pipeline under `src/services/generation/`:
 *   ContextBuilder → PromptAssembler → Generator(tool-use) → Validator → Persister → Summarizer
 *
 * This file preserves the original import path (`../services/content.service`)
 * used by the controllers and the preemptive service, so nothing downstream
 * had to change.
 */
export { contentService } from "./generation";
export type { StudentContextInput, GeneratedQuestion } from "./generation/types";
