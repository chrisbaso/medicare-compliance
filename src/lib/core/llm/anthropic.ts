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

      const response = await anthropic.messages.create({
        model: request.model,
        max_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0,
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
