import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poker Planning",
  description: "Estimation collaborative en temps réel pour équipe agile",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          background: "#0f1117",
          color: "#e8eaf0",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
