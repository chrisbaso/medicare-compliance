import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Conversation, ConsentRecord, FollowUpOpportunity } from "@/lib/types";

export function NextActionsPanel({
  conversation,
  pendingConsent,
  opportunity,
  onCreateFollowUp,
  canManageFollowUp
}: {
  conversation: Conversation;
  pendingConsent?: ConsentRecord;
  opportunity?: FollowUpOpportunity;
  onCreateFollowUp: () => void;
  canManageFollowUp: boolean;
}) {
  return (
    <Card>
      <h3 className="font-serif text-2xl text-ink-950">Next actions</h3>
      <p className="mt-2 text-sm text-stone-600">{conversation.nextStep}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge value={conversation.routingState} tone={conversation.routingState === "blocked" ? "danger" : "info"} />
        {pendingConsent ? <Badge value={`consent ${pendingConsent.status}`} tone="warning" /> : null}
        {canManageFollowUp && opportunity ? <Badge value={`follow-up ${opportunity.status}`} tone="info" /> : null}
      </div>
      {canManageFollowUp && conversation.retirementInterestDetected && !opportunity ? (
        <Button className="mt-4" onClick={onCreateFollowUp}>
          Create separate follow-up
        </Button>
      ) : null}
    </Card>
  );
}
