import { Badge } from "@/components/ui/badge";
import {
  getConsentDisplay
} from "@/lib/consent-view";
import { ConsentRecord, ConsentStatus, ConsentType } from "@/lib/types";
import { cn } from "@/lib/utils";

type ConsentStatusBadgeProps =
  | {
      consentType: ConsentType;
      status: ConsentStatus;
      evidenceComplete?: boolean;
      record?: never;
    }
  | {
      consentType?: never;
      status?: never;
      evidenceComplete?: never;
      record: Pick<ConsentRecord, "consentType" | "status" | "evidenceComplete">;
    };

export function ConsentStatusBadge({
  className,
  showBlockerHint = false,
  showCategoryLabel = false,
  ...props
}: ConsentStatusBadgeProps & {
  className?: string;
  showBlockerHint?: boolean;
  showCategoryLabel?: boolean;
}) {
  const record =
    "record" in props && props.record
      ? props.record
      : {
          consentType: props.consentType,
          status: props.status,
          evidenceComplete: props.evidenceComplete ?? true
        };
  const consent = getConsentDisplay(record);
  const leadingLabel = showCategoryLabel ? consent.categoryLabel : consent.typeLabel;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2 py-1",
        consent.classes.container,
        className
      )}
    >
      <span
        className={cn(
          "rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide",
          consent.classes.label
        )}
      >
        {leadingLabel}
      </span>
      <Badge value={consent.statusLabel} tone={consent.tone} className="px-2 py-1 normal-case" />
      {showBlockerHint && consent.blockerLabel ? (
        <Badge value={consent.blockerLabel} tone="danger" className="px-2 py-1 normal-case" />
      ) : null}
    </span>
  );
}
