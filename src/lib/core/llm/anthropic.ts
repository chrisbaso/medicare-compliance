import Anthropic from "@anthropic-ai/sdk";
import { requireAnthropicEnv } from "@/lib/core/env/server";
import { LlmCompletionRequest, LlmProvider } from "@/lib/core/llm/types";

type AnthropicMessageRole = "user" | "assistant";

export function createAnthropicProvider(): LlmProvider {
  return {
    async complete(request: LlmCompletionRequest) {
      const { anthropicApiKey } = requireAnthropicEnv();
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      const system = request.messages.find((message) => message.role === "system")?.content;
      const messages = request.messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          role: message.role as AnthropicMessageRole,
          content: message.content
        }));

      // Forward sampling params only when explicitly set: current Claude
      // models (Sonnet 5 / Opus 4.7+) reject a non-default temperature with
      // a 400, so the wrapper must never inject one on its own.
      const response = await anthropic.messages.create({
        model: request.model,
        max_tokens: request.maxTokens ?? 4000,
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        system,
        messages
      });
      const text = response.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

      return {
        text,
        provider: "anthropic",
        model: request.model
      };
    }
  };
}
