import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Socialshit — Instagram & Facebook Marketing",
  description:
    "Auto-generate content and captions, connect business accounts, and auto-publish or schedule to Instagram and Facebook.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
