export interface MedicareSeason {
  code: "aep" | "oep" | "iep" | "sep" | "general";
  label: string;
  monthDayStart?: string;
  monthDayEnd?: string;
  operationalNote: string;
}

export const medicareSeasons: MedicareSeason[] = [
  {
    code: "aep",
    label: "Annual Enrollment Period",
    monthDayStart: "10-15",
    monthDayEnd: "12-07",
    operationalNote: "Expect higher conversation volume, stricter QA sampling, and more plan-change questions."
  },
  {
    code: "oep",
    label: "Medicare Advantage Open Enrollment Period",
    monthDayStart: "01-01",
    monthDayEnd: "03-31",
    operationalNote: "Watch for plan-change language and ensure conversations stay educational."
  },
  {
    code: "iep",
    label: "Initial Enrollment Period",
    operationalNote: "Used for turning-65 and first-time Medicare workflows."
  },
  {
    code: "sep",
    label: "Special Enrollment Period",
    operationalNote: "Requires event-specific documentation and human review."
  },
  {
    code: "general",
    label: "General operations",
    operationalNote: "Default workflow for service, consent, and QA operations outside named cycles."
  }
];

export function getCurrentMedicareSeason(referenceDate = new Date()) {
  const monthDay = `${String(referenceDate.getMonth() + 1).padStart(2, "0")}-${String(referenceDate.getDate()).padStart(2, "0")}`;

  return medicareSeasons.find((season) => {
    if (!season.monthDayStart || !season.monthDayEnd) {
      return false;
    }

    return monthDay >= season.monthDayStart && monthDay <= season.monthDayEnd;
  }) ?? medicareSeasons.find((season) => season.code === "general")!;
}
