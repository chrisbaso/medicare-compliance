import type { Metadata } from "next";
import { DemoAppProvider, type AuthenticatedDemoUser } from "@/components/providers/demo-app-provider";
import { RootFrame } from "@/components/root-frame";
import { getCurrentUser } from "@/lib/core/auth/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compliance-Based Medicare System",
  description: "Compliance-first operations platform MVP for Medicare agencies."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  const authenticatedUser: AuthenticatedDemoUser | null = currentUser
    ? {
        id: currentUser.id,
        organizationId: currentUser.organizationId,
        fullName: currentUser.fullName,
        email: currentUser.email,
        licenseType: currentUser.licenseType,
        team: currentUser.team,
        roles: currentUser.roles
      }
    : null;

  return (
    <html lang="en">
      <body>
        <DemoAppProvider authenticatedUser={authenticatedUser}>
          <RootFrame>{children}</RootFrame>
        </DemoAppProvider>
      </body>
    </html>
  );
}
