import { LlmProvider } from "@/lib/core/llm/types";

export function createMockLlmProvider(responseText: string): LlmProvider {
  return {
    async complete(request) {
      return {
        text: responseText,
        provider: "mock",
        model: request.model
      };
    }
  };
}
