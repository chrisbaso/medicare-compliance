import { medicareComplianceRules } from "@/lib/verticals/medicare/compliance-rules";
import { medicareAiPrompts } from "@/lib/verticals/medicare/ai-prompts";
import { medicareDocumentTemplates } from "@/lib/verticals/medicare/documents";
import { medicareSeasons } from "@/lib/verticals/medicare/seasonality";
import { medicareVocabulary } from "@/lib/verticals/medicare/vocabulary";
import {
  medicareConversationWorkflow,
  retirementIncomeHandoffWorkflow
} from "@/lib/verticals/medicare/workflows";

export const medicareVerticalPack = {
  slug: "medicare",
  displayName: "Medicare agency operations",
  complianceRules: medicareComplianceRules,
  workflowTemplates: [medicareConversationWorkflow, retirementIncomeHandoffWorkflow],
  documentTemplates: medicareDocumentTemplates,
  vocabulary: medicareVocabulary,
  aiPrompts: medicareAiPrompts,
  seasonality: medicareSeasons
};
