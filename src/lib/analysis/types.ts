import {
  ConsentRecord,
  ConversationChannel,
  DetectedTopic,
  FlagSeverity,
  OpportunitySignalType
} from "@/lib/types";
import { ComplianceRuleKey } from "@/lib/compliance/rules";

export interface TranscriptAnalysisEntry {
  id: string;
  speakerType: "client" | "agent" | "service" | "system";
  speakerName: string;
  utterance: string;
  spokenAt?: string;
}

export interface TranscriptAnalysisInput {
  transcript: TranscriptAnalysisEntry[];
  channel?: ConversationChannel;
  conversationType?: string;
  consentRecords?: Pick<ConsentRecord, "consentType" | "status" | "evidenceComplete">[];
  hasExistingFollowUpWorkflow?: boolean;
}

export interface AnalysisComplianceFlag {
  title: string;
  severity: FlagSeverity;
  ruleKey: ComplianceRuleKey;
  explanation: string;
  remediationGuidance: string;
  blocksWorkflow: boolean;
  status: "open";
  matchedPhrases?: string[];
}

export interface AnalysisOpportunitySignal {
  signalType: OpportunitySignalType | "annuity_interest";
  summary: string;
  requiresSeparateWorkflow: boolean;
  consentStatus: "not_required" | "missing" | "pending" | "granted" | "revoked";
  workflowCreated: boolean;
}

export interface TranscriptAnalysisResult {
  summary: string;
  clientIntent: string;
  detectedTopics: DetectedTopic[];
  keyFacts: string[];
  unresolvedItems: string[];
  recommendedNextAction: string;
  complianceFlags: AnalysisComplianceFlag[];
  opportunitySignals: AnalysisOpportunitySignal[];
  confidenceScore: number;
}
