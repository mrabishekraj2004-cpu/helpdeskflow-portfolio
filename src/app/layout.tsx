import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "HelpDeskFlow — Support, in order",
  description:
    "An AI-assisted portfolio project by Abishek Akash. A working, role-based IT helpdesk.",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
