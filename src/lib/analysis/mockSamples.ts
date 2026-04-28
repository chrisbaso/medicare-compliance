import { TranscriptAnalysisInput, TranscriptAnalysisResult } from "@/lib/analysis/types";

export interface TranscriptAnalysisMockSample {
  id: string;
  title: string;
  input: TranscriptAnalysisInput;
  expected: TranscriptAnalysisResult;
}

export const transcriptAnalysisMockSamples: TranscriptAnalysisMockSample[] = [
  {
    id: "sample-001",
    title: "Turning-65 intake with neutral education",
    input: {
      channel: "phone",
      conversationType: "Turning 65 intake",
      transcript: [
        {
          id: "s1-1",
          speakerType: "client",
          speakerName: "Margaret Ellis",
          utterance: "I turn 65 in July and want to understand my Medicare timeline."
        },
        {
          id: "s1-2",
          speakerType: "agent",
          speakerName: "Alex Rivera",
          utterance:
            "I can walk through the timeline and your Medicare supplement questions in a neutral way."
        }
      ],
      consentRecords: [{ consentType: "recording", status: "granted", evidenceComplete: true }]
    },
    expected: {
      summary:
        "Turning-65 conversation focused on neutral Medicare education and next-step readiness.",
      clientIntent:
        "The client wants Medicare timing, intake, or neutral education support.",
      detectedTopics: ["turning_65", "medigap_review"],
      keyFacts: ["Channel: phone", "Conversation type: Turning 65 intake"],
      unresolvedItems: ["No unresolved items identified by the mock analyzer."],
      recommendedNextAction:
        "Prepare a neutral summary and route the conversation for the next human review step.",
      complianceFlags: [],
      opportunitySignals: [],
      confidenceScore: 0.7
    }
  },
  {
    id: "sample-002",
    title: "Part D formulary service question",
    input: {
      channel: "phone",
      conversationType: "Part D education",
      transcript: [
        {
          id: "s2-1",
          speakerType: "client",
          speakerName: "Patricia Boone",
          utterance:
            "My pharmacy says one of my drugs is no longer on the formulary. What should I do?"
        },
        {
          id: "s2-2",
          speakerType: "service",
          speakerName: "Mia Chen",
          utterance:
            "I will document the Part D question and send the neutral formulary follow-up."
        }
      ],
      consentRecords: [{ consentType: "recording", status: "granted", evidenceComplete: true }]
    },
    expected: {
      summary:
        "Part D discussion focused on neutral education and plan-related service questions.",
      clientIntent:
        "The client wants neutral information about Part D coverage or formulary issues.",
      detectedTopics: ["part_d_question"],
      keyFacts: ["Channel: phone", "Conversation type: Part D education"],
      unresolvedItems: ["No unresolved items identified by the mock analyzer."],
      recommendedNextAction:
        "Prepare a neutral summary and route the conversation for the next human review step.",
      complianceFlags: [],
      opportunitySignals: [],
      confidenceScore: 0.65
    }
  },
  {
    id: "sample-003",
    title: "Service-only billing call with no sales signal",
    input: {
      channel: "service_call",
      conversationType: "Service only",
      transcript: [
        {
          id: "s3-1",
          speakerType: "client",
          speakerName: "Susan Whitaker",
          utterance: "I need help with a billing draft and my mailing address."
        },
        {
          id: "s3-2",
          speakerType: "service",
          speakerName: "Mia Chen",
          utterance:
            "I will update the address and confirm the billing draft timing in the service queue."
        }
      ],
      consentRecords: [{ consentType: "contact", status: "granted", evidenceComplete: true }]
    },
    expected: {
      summary:
        "Service-focused conversation documented without any product recommendation.",
      clientIntent:
        "The client is asking for service help or account follow-through rather than a product discussion.",
      detectedTopics: ["service_call"],
      keyFacts: [
        "Channel: service call",
        "Conversation type: Service only",
        "The transcript includes service or account-maintenance context."
      ],
      unresolvedItems: ["No unresolved items identified by the mock analyzer."],
      recommendedNextAction:
        "Document the service resolution and keep the conversation in the service workflow unless the client clearly requests more.",
      complianceFlags: [],
      opportunitySignals: [],
      confidenceScore: 0.65
    }
  },
  {
    id: "sample-004",
    title: "Premium increase with separate retirement-income interest",
    input: {
      channel: "phone",
      conversationType: "Medigap review",
      transcript: [
        {
          id: "s4-1",
          speakerType: "client",
          speakerName: "Donna Fields",
          utterance:
            "This premium increase has me wondering if retirement income can support future costs."
        },
        {
          id: "s4-2",
          speakerType: "agent",
          speakerName: "Alex Rivera",
          utterance:
            "We need to keep that topic separate from your Medicare review and only continue later with your permission."
        }
      ],
      consentRecords: [{ consentType: "recording", status: "granted", evidenceComplete: true }],
      hasExistingFollowUpWorkflow: false
    },
    expected: {
      summary:
        "Medicare Supplement review focused on client questions and documented next steps. A separate follow-up signal was detected and should remain outside the Medicare workflow. Transcript review found compliance items that need human attention.",
      clientIntent: "The client wants neutral Medicare Supplement review support.",
      detectedTopics: [
        "medigap_review",
        "premium_increase",
        "retirement_income_interest",
        "consent"
      ],
      keyFacts: [
        "Channel: phone",
        "Conversation type: Medigap review",
        "The client raised premium or affordability concerns.",
        "Retirement-income related discussion must stay outside Medicare plan guidance.",
        "Separate follow-up consent status: missing.",
        "Separate workflow already created: no."
      ],
      unresolvedItems: [
        "incomplete_handoff_to_licensed_human: Document a separate licensed-human handoff and keep any follow-up outside the Medicare workflow.",
        "Separate follow-up consent is not fully documented yet.",
        "No separate follow-up workflow has been created yet."
      ],
      recommendedNextAction:
        "Pause additional outreach and route the conversation for human compliance review.",
      complianceFlags: [
        {
          title: "Incomplete handoff to licensed human",
          severity: "medium",
          ruleKey: "incomplete_handoff_to_licensed_human",
          explanation:
            "A retirement-income signal was detected, but the transcript does not show a clear separate handoff to a licensed human.",
          remediationGuidance:
            "Document a separate licensed-human handoff and keep any follow-up outside the Medicare workflow.",
          blocksWorkflow: true,
          status: "open"
        }
      ],
      opportunitySignals: [
        {
          signalType: "premium_pressure",
          summary:
            "Premium pressure may justify a later, separate retirement-income follow-up if explicitly consented.",
          requiresSeparateWorkflow: true,
          consentStatus: "missing",
          workflowCreated: false
        }
      ],
      confidenceScore: 0.94
    }
  },
  {
    id: "sample-005",
    title: "Steering phrase around Medicare Advantage",
    input: {
      channel: "phone",
      conversationType: "Medicare plan comparison education",
      transcript: [
        {
          id: "s5-1",
          speakerType: "client",
          speakerName: "Harold Foster",
          utterance: "How does Medicare Advantage compare to a supplement?"
        },
        {
          id: "s5-2",
          speakerType: "agent",
          speakerName: "Alex Rivera",
          utterance:
            "Medicare Advantage is the best plan for most people, and you should switch."
        }
      ],
      consentRecords: [{ consentType: "recording", status: "granted", evidenceComplete: true }]
    },
    expected: {
      summary:
        "Medicare Advantage questions surfaced inside a Medicare conversation and should stay neutral. Transcript review found compliance items that need human attention.",
      clientIntent:
        "The client wants neutral information about Medicare Advantage during a Medicare conversation.",
      detectedTopics: [
        "medigap_review",
        "medicare_advantage_question",
        "compliance_review"
      ],
      keyFacts: [
        "Channel: phone",
        "Conversation type: Medicare plan comparison education"
      ],
      unresolvedItems: [
        "product_recommendation_language: Replace recommendation language with neutral education and route the conversation for human compliance review.",
        "plan_comparison_risk: Keep the comparison educational, avoid recommendation language, and route for review if the discussion becomes directive."
      ],
      recommendedNextAction:
        "Pause additional outreach and route the conversation for human compliance review.",
      complianceFlags: [
        {
          title: "Product recommendation language",
          severity: "high",
          ruleKey: "product_recommendation_language",
          explanation:
            "Directive language can imply that the system or staff recommended a specific Medicare plan.",
          remediationGuidance:
            "Replace recommendation language with neutral education and route the conversation for human compliance review.",
          blocksWorkflow: true,
          status: "open",
          matchedPhrases: ["best plan", "you should switch"]
        },
        {
          title: "Plan comparison risk",
          severity: "medium",
          ruleKey: "plan_comparison_risk",
          explanation:
            "Plan comparison language can drift into recommendation territory and should stay neutral.",
          remediationGuidance:
            "Keep the comparison educational, avoid recommendation language, and route for review if the discussion becomes directive.",
          blocksWorkflow: false,
          status: "open"
        }
      ],
      opportunitySignals: [],
      confidenceScore: 0.89
    }
  },
  {
    id: "sample-006",
    title: "Cross-sell contamination with annuity talk",
    input: {
      channel: "phone",
      conversationType: "Medigap review",
      transcript: [
        {
          id: "s6-1",
          speakerType: "client",
          speakerName: "Kenneth Yates",
          utterance:
            "The rate increase is hard, and I have also been thinking about an annuity."
        },
        {
          id: "s6-2",
          speakerType: "agent",
          speakerName: "Riley Torres",
          utterance:
            "We can talk about the annuity while we review your Medicare supplement options."
        }
      ],
      consentRecords: [{ consentType: "recording", status: "granted", evidenceComplete: true }]
    },
    expected: {
      summary:
        "Medicare Supplement review focused on client questions and documented next steps. A separate follow-up signal was detected and should remain outside the Medicare workflow. Transcript review found compliance items that need human attention.",
      clientIntent: "The client wants neutral Medicare Supplement review support.",
      detectedTopics: ["medigap_review", "premium_increase", "annuity_interest"],
      keyFacts: [
        "Channel: phone",
        "Conversation type: Medigap review",
        "The client raised premium or affordability concerns.",
        "Retirement-income related discussion must stay outside Medicare plan guidance.",
        "Separate follow-up consent status: missing.",
        "Separate workflow already created: no."
      ],
      unresolvedItems: [
        "cross_sell_contamination: Stop product crossover, document the separation, and move any later discussion into a separate consented workflow.",
        "incomplete_handoff_to_licensed_human: Document a separate licensed-human handoff and keep any follow-up outside the Medicare workflow.",
        "Separate follow-up consent is not fully documented yet.",
        "No separate follow-up workflow has been created yet."
      ],
      recommendedNextAction:
        "Pause additional outreach and route the conversation for human compliance review.",
      complianceFlags: [
        {
          title: "Cross-sell contamination",
          severity: "high",
          ruleKey: "cross_sell_contamination",
          explanation:
            "Retirement-income, annuity, or life-insurance discussion appeared inside a Medicare health or drug-plan workflow.",
          remediationGuidance:
            "Stop product crossover, document the separation, and move any later discussion into a separate consented workflow.",
          blocksWorkflow: true,
          status: "open"
        },
        {
          title: "Incomplete handoff to licensed human",
          severity: "medium",
          ruleKey: "incomplete_handoff_to_licensed_human",
          explanation:
            "A retirement-income signal was detected, but the transcript does not show a clear separate handoff to a licensed human.",
          remediationGuidance:
            "Document a separate licensed-human handoff and keep any follow-up outside the Medicare workflow.",
          blocksWorkflow: true,
          status: "open"
        }
      ],
      opportunitySignals: [
        {
          signalType: "annuity_interest",
          summary:
            "Annuity or life-insurance interest appeared in the transcript and must remain outside the Medicare workflow.",
          requiresSeparateWorkflow: true,
          consentStatus: "missing",
          workflowCreated: false
        }
      ],
      confidenceScore: 0.94
    }
  },
  {
    id: "sample-007",
    title: "Implied government endorsement",
    input: {
      channel: "phone",
      conversationType: "Turning 65 intake",
      transcript: [
        {
          id: "s7-1",
          speakerType: "client",
          speakerName: "Paul Sandoval",
          utterance: "How do I know who to trust?"
        },
        {
          id: "s7-2",
          speakerType: "agent",
          speakerName: "Alex Rivera",
          utterance: "We are a Medicare-approved agency, so you can rely on our guidance."
        }
      ],
      consentRecords: [{ consentType: "recording", status: "granted", evidenceComplete: true }]
    },
    expected: {
      summary:
        "Turning-65 conversation focused on neutral Medicare education and next-step readiness. Transcript review found compliance items that need human attention.",
      clientIntent:
        "The client wants Medicare timing, intake, or neutral education support.",
      detectedTopics: ["turning_65", "compliance_review"],
      keyFacts: ["Channel: phone", "Conversation type: Turning 65 intake"],
      unresolvedItems: [
        "implied_government_endorsement: Pause outreach and escalate for compliance review immediately."
      ],
      recommendedNextAction:
        "Pause additional outreach and route the conversation for human compliance review.",
      complianceFlags: [
        {
          title: "Implied government endorsement",
          severity: "critical",
          ruleKey: "implied_government_endorsement",
          explanation:
            "Language implying Medicare or government approval, sponsorship, or endorsement is not allowed.",
          remediationGuidance:
            "Pause outreach and escalate for compliance review immediately.",
          blocksWorkflow: true,
          status: "open",
          matchedPhrases: ["medicare-approved agency"]
        }
      ],
      opportunitySignals: [],
      confidenceScore: 0.77
    }
  },
  {
    id: "sample-008",
    title: "Separate follow-up consent granted",
    input: {
      channel: "phone",
      conversationType: "Separate follow-up only",
      transcript: [
        {
          id: "s8-1",
          speakerType: "client",
          speakerName: "Gloria Bennett",
          utterance:
            "I want a later conversation about income stability after the market volatility."
        },
        {
          id: "s8-2",
          speakerType: "agent",
          speakerName: "Casey Monroe",
          utterance:
            "We can handle that as a separate licensed follow-up now that you have given permission."
        }
      ],
      consentRecords: [
        { consentType: "retirement_follow_up", status: "granted", evidenceComplete: true }
      ],
      hasExistingFollowUpWorkflow: true
    },
    expected: {
      summary:
        "Operational Medicare conversation documented for review and follow-through. A separate follow-up signal was detected and should remain outside the Medicare workflow.",
      clientIntent:
        "The client raised a separate retirement-income concern that requires a separate consented workflow.",
      detectedTopics: ["market_risk_concern", "retirement_income_interest", "consent"],
      keyFacts: [
        "Channel: phone",
        "Conversation type: Separate follow-up only",
        "Retirement-income related discussion must stay outside Medicare plan guidance.",
        "Separate follow-up consent status: granted.",
        "Separate workflow already created: yes."
      ],
      unresolvedItems: ["No unresolved items identified by the mock analyzer."],
      recommendedNextAction:
        "Continue with a separate consented follow-up workflow owned by a licensed human.",
      complianceFlags: [],
      opportunitySignals: [
        {
          signalType: "market_risk_concern",
          summary:
            "Market-risk concerns suggest a potential separate follow-up if the client wants one.",
          requiresSeparateWorkflow: true,
          consentStatus: "granted",
          workflowCreated: true
        }
      ],
      confidenceScore: 0.83
    }
  },
  {
    id: "sample-009",
    title: "Service call with CD mention but no expressed interest",
    input: {
      channel: "service_call",
      conversationType: "Service only",
      transcript: [
        {
          id: "s9-1",
          speakerType: "client",
          speakerName: "Leonard Price",
          utterance:
            "One of my CDs renews soon, but I do not want to get into that on this call."
        },
        {
          id: "s9-2",
          speakerType: "service",
          speakerName: "Mia Chen",
          utterance:
            "Understood. I will just document the service note and keep this call focused on the document request."
        }
      ],
      consentRecords: [{ consentType: "contact", status: "granted", evidenceComplete: true }]
    },
    expected: {
      summary:
        "Service-focused conversation documented without any product recommendation.",
      clientIntent:
        "The client is asking for service help or account follow-through rather than a product discussion.",
      detectedTopics: ["service_call", "cd_maturing"],
      keyFacts: [
        "Channel: service call",
        "Conversation type: Service only",
        "The transcript includes service or account-maintenance context."
      ],
      unresolvedItems: ["No unresolved items identified by the mock analyzer."],
      recommendedNextAction:
        "Document the service resolution and keep the conversation in the service workflow unless the client clearly requests more.",
      complianceFlags: [],
      opportunitySignals: [],
      confidenceScore: 0.7
    }
  },
  {
    id: "sample-010",
    title: "Unsupported claims and high-pressure language",
    input: {
      channel: "phone",
      conversationType: "Medicare plan comparison education",
      transcript: [
        {
          id: "s10-1",
          speakerType: "client",
          speakerName: "Elaine Porter",
          utterance: "Can you compare these options and tell me what happens next?"
        },
        {
          id: "s10-2",
          speakerType: "agent",
          speakerName: "Jordan Blake",
          utterance:
            "This is guaranteed to work out better for you, and you need to act now before it's too late."
        }
      ],
      consentRecords: [{ consentType: "recording", status: "granted", evidenceComplete: true }]
    },
    expected: {
      summary:
        "Operational Medicare conversation documented for review and follow-through. Transcript review found compliance items that need human attention.",
      clientIntent:
        "The client needs documented Medicare operations support and human follow-through.",
      detectedTopics: ["compliance_review"],
      keyFacts: [
        "Channel: phone",
        "Conversation type: Medicare plan comparison education"
      ],
      unresolvedItems: [
        "unsupported_claims: Remove unsupported claims and have a human reviewer verify the transcript summary.",
        "urgency_high_pressure_language: Remove urgency language and restate the next step in neutral operational terms."
      ],
      recommendedNextAction:
        "Pause additional outreach and route the conversation for human compliance review.",
      complianceFlags: [
        {
          title: "Unsupported claims",
          severity: "high",
          ruleKey: "unsupported_claims",
          explanation:
            "Guarantee or certainty language can create misleading expectations and requires human review.",
          remediationGuidance:
            "Remove unsupported claims and have a human reviewer verify the transcript summary.",
          blocksWorkflow: true,
          status: "open",
          matchedPhrases: ["guaranteed"]
        },
        {
          title: "Urgency or high-pressure language",
          severity: "medium",
          ruleKey: "urgency_high_pressure_language",
          explanation:
            "Pressure tactics can create inappropriate urgency in a Medicare or separate follow-up conversation.",
          remediationGuidance:
            "Remove urgency language and restate the next step in neutral operational terms.",
          blocksWorkflow: false,
          status: "open",
          matchedPhrases: ["act now", "before it's too late"]
        }
      ],
      opportunitySignals: [],
      confidenceScore: 0.84
    }
  }
];
