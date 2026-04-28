import { ComplianceFlag, ConsentRecord, FollowUpOpportunity, Task } from "@/lib/types";

export function getComplianceFlagCounts(flags: ComplianceFlag[]) {
  return flags.reduce<Record<string, number>>((counts, flag) => {
    counts[flag.severity] = (counts[flag.severity] ?? 0) + 1;
    counts[flag.status] = (counts[flag.status] ?? 0) + 1;
    return counts;
  }, {});
}

export function getConsentLedgerCounts(consents: ConsentRecord[]) {
  return consents.reduce<Record<string, number>>((counts, consent) => {
    counts[consent.status] = (counts[consent.status] ?? 0) + 1;
    counts[consent.consentType] = (counts[consent.consentType] ?? 0) + 1;
    return counts;
  }, {});
}

export function getOpenOperationalCounts({
  flags,
  tasks,
  opportunities
}: {
  flags: ComplianceFlag[];
  tasks: Task[];
  opportunities: FollowUpOpportunity[];
}) {
  return {
    openFlags: flags.filter((flag) => flag.status === "open").length,
    openTasks: tasks.filter((task) => task.status !== "done").length,
    consentBlockedRetirementWorkflows: opportunities.filter(
      (opportunity) => opportunity.explicitConsentStatus !== "granted"
    ).length
  };
}
