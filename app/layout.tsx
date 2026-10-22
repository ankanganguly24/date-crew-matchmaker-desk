import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Matchmaker Desk · The Date Crew",
  description:
    "An independent assessment prototype. 1,500 fictional profiles. Human judgment, with the facts close at hand.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
