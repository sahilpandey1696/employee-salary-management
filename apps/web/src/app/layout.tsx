import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Employee Salary Management",
  description: "HR salary management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          <AppProviders>{children}</AppProviders>
        </AppShell>
      </body>
    </html>
  );
}
