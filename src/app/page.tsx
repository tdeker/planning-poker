"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [room, setRoom] = useState("");
  const router = useRouter();

  const go = () => {
    const slug = room.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    router.push(`/room/${slug || "equipe"}`);
  };

  const random = () => {
    router.push(`/room/${Math.random().toString(36).slice(2, 8)}`);
  };

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>🃏 Poker Planning</h1>
      <p style={{ color: "#8b90a0", fontSize: 14, marginTop: 6, marginBottom: 28 }}>
        Crée une salle d'estimation et partage son lien avec ton équipe. Les votes se synchronisent en temps réel.
      </p>

      <label style={{ display: "block", fontSize: 13, color: "#8b90a0", marginBottom: 6 }}>Nom de la salle</label>
      <input
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="Ex. sprint-42"
        style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, border: "1px solid #2a2f3d", background: "#171a23", color: "#e8eaf0", fontSize: 15, outline: "none" }}
      />

      <button
        onClick={go}
        style={{ width: "100%", marginTop: 16, padding: "13px", borderRadius: 10, border: "none", cursor: "pointer", background: "#6c5ce7", color: "#fff", fontSize: 15, fontWeight: 600 }}
      >
        Rejoindre la salle
      </button>
      <button
        onClick={random}
        style={{ width: "100%", marginTop: 10, padding: "11px", borderRadius: 10, cursor: "pointer", background: "transparent", color: "#8b90a0", fontSize: 14, border: "1px solid #2a2f3d" }}
      >
        Créer une salle au hasard
      </button>
    </main>
  );
}
