import "server-only";

import { createServerClient } from "@/lib/core/supabase/server";
import { Tables } from "../../../../supabase/types";

export interface CurrentUser {
  id: string;
  authUserId: string;
  organizationId: string;
  fullName: string;
  email: string;
  licenseType: Tables<"users">["license_type"];
  team: string | null;
  roles: Tables<"user_roles">["role"][];
}

export interface CurrentOrganization {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  verticalSlug: string;
}

function isMissingSupabaseEnvironment(error: unknown) {
  return error instanceof Error && error.message.includes("Supabase public environment is not configured");
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  let supabase: Awaited<ReturnType<typeof createServerClient>>;

  try {
    supabase = await createServerClient();
  } catch (error) {
    if (isMissingSupabaseEnvironment(error)) {
      return null;
    }

    throw error;
  }

  const {
    data: { user: authUser },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .eq("is_active", true)
    .maybeSingle();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!appUser) {
    return null;
  }

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("organization_id", appUser.organization_id)
    .eq("user_id", appUser.id);

  if (roleError) {
    throw new Error(roleError.message);
  }

  return {
    id: appUser.id,
    authUserId: authUser.id,
    organizationId: appUser.organization_id,
    fullName: appUser.full_name,
    email: appUser.email,
    licenseType: appUser.license_type,
    team: appUser.team,
    roles: (roleRows ?? []).map((row) => row.role)
  };
}

export async function getCurrentOrganization(): Promise<CurrentOrganization | null> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const supabase = await createServerClient();
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", currentUser.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!organization) {
    return null;
  }

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    timezone: organization.timezone,
    verticalSlug: organization.vertical_slug
  };
}
