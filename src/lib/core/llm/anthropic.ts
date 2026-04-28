import { assertAnthropicConfigured, getAppEnv } from "@/lib/core/env";
import { LlmCompletionRequest, LlmProvider } from "@/lib/core/llm/types";

export function createAnthropicProvider(): LlmProvider {
  return {
    async complete(request: LlmCompletionRequest) {
      const { apiKey } = assertAnthropicConfigured(getAppEnv());
      const system = request.messages.find((message) => message.role === "system")?.content;
      const messages = request.messages
        .filter((message) => message.role !== "system")
        .map((message) => ({ role: message.role, content: message.content }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.maxTokens ?? 2000,
          temperature: request.temperature ?? 0,
          system,
          messages
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Anthropic request failed (${response.status}): ${text}`);
      }

      const json = await response.json() as { content?: { type: string; text?: string }[] };
      const text = json.content?.find((part) => part.type === "text")?.text ?? "";

      return {
        text,
        provider: "anthropic",
        model: request.model
      };
    }
  };
}
