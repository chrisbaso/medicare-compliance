import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { DemoAppProvider } from "@/components/providers/demo-app-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compliance-Based Medicare System",
  description: "Compliance-first operations platform MVP for Medicare agencies."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DemoAppProvider>
          <AppShell>{children}</AppShell>
        </DemoAppProvider>
      </body>
    </html>
  );
}
