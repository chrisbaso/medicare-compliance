import { LicenseType, UserRole } from "@/lib/types";

export type AppPermission =
  | "clients:read"
  | "conversations:review"
  | "consents:capture"
  | "consents:revoke"
  | "compliance:review"
  | "tasks:manage"
  | "retirement_followup:read"
  | "retirement_followup:manage"
  | "admin:manage_users";

const rolePermissions: Record<UserRole, AppPermission[]> = {
  manager: [
    "clients:read",
    "conversations:review",
    "consents:capture",
    "consents:revoke",
    "compliance:review",
    "tasks:manage",
    "retirement_followup:read",
    "retirement_followup:manage",
    "admin:manage_users"
  ],
  compliance: [
    "clients:read",
    "conversations:review",
    "consents:capture",
    "consents:revoke",
    "compliance:review",
    "tasks:manage",
    "retirement_followup:read"
  ],
  agent: [
    "clients:read",
    "conversations:review",
    "consents:capture",
    "tasks:manage"
  ],
  service: [
    "clients:read",
    "conversations:review",
    "consents:capture",
    "tasks:manage"
  ]
};

export function hasPermission(role: UserRole, permission: AppPermission) {
  return rolePermissions[role].includes(permission);
}

export function canAccessRetirementFollowUp(role: UserRole, licenseType: LicenseType) {
  return (
    hasPermission(role, "retirement_followup:read") &&
    (role === "manager" ||
      role === "compliance" ||
      licenseType === "life_health" ||
      licenseType === "series65_plus")
  );
}

export function canManageRetirementFollowUp(role: UserRole, licenseType: LicenseType) {
  return canAccessRetirementFollowUp(role, licenseType) &&
    (licenseType === "life_health" || licenseType === "series65_plus" || role === "manager");
}
