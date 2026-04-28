import { ConsentRecord } from "@/lib/types";

export function ScopeOfAppointmentTemplate({
  clientName,
  capturedAt
}: {
  clientName: string;
  capturedAt: string;
}) {
  return (
    <section>
      <h2>Scope of Appointment</h2>
      <p>Client: {clientName}</p>
      <p>Captured: {capturedAt}</p>
      <p>
        The conversation is limited to Medicare-related topics selected by the beneficiary.
        Any retirement-income, annuity, or life-insurance follow-up requires separate consent.
      </p>
    </section>
  );
}

export function ConsentLedgerExportTemplate({ records }: { records: ConsentRecord[] }) {
  return (
    <section>
      <h2>Consent Ledger Export</h2>
      <ul>
        {records.map((record) => (
          <li key={record.id}>
            {record.consentType} / {record.status} / {record.capturedAt} / {record.evidenceRef}
          </li>
        ))}
      </ul>
    </section>
  );
}

export const medicareDocumentTemplates = [
  {
    id: "scope_of_appointment",
    title: "Scope of Appointment",
    component: ScopeOfAppointmentTemplate
  },
  {
    id: "consent_ledger_export",
    title: "Consent Ledger Export",
    component: ConsentLedgerExportTemplate
  }
];
