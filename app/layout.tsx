import type { Metadata } from "next";
import { DemoAppProvider } from "@/components/providers/demo-app-provider";
import { RootFrame } from "@/components/root-frame";
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
          <RootFrame>{children}</RootFrame>
        </DemoAppProvider>
      </body>
    </html>
  );
}
