"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, type Vote, type Room } from "@/lib/supabase";

const DECKS: Record<string, { label: string; cards: string[] }> = {
  fibonacci: { label: "Fibonacci", cards: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "?", "☕"] },
  modified: { label: "Suite modifiée", cards: ["0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "100", "?", "☕"] },
  tshirt: { label: "T-shirt", cards: ["XS", "S", "M", "L", "XL", "XXL", "?", "☕"] },
};

const NON_NUMERIC = new Set(["?", "☕", "XS", "S", "M", "L", "XL", "XXL", "½"]);
const DECK_KEY = "fibonacci";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function average(cards: (string | null)[]): number | null {
  const nums = cards
    .filter((c): c is string => c != null && !NON_NUMERIC.has(c))
    .map((c) => parseFloat(c))
    .filter((n) => !isNaN(n));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export default function PokerRoom({ room }: { room: string }) {
  const [meId] = useState(uid);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [roomState, setRoomState] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef(name);
  nameRef.current = name;

  const deck = DECKS[roomState?.["deck_key" as keyof Room] as string] ?? DECKS[DECK_KEY];

  const loadAll = useCallback(async () => {
    const [{ data: r }, { data: v }] = await Promise.all([
      supabase.from("rooms").select("*").eq("room", room).maybeSingle(),
      supabase.from("votes").select("*").eq("room", room),
    ]);
    if (!r) {
      await supabase.from("rooms").upsert({ room, story_title: "", revealed: false, deck_key: DECK_KEY });
      setRoomState({ room, story_title: "", revealed: false, updated_at: new Date().toISOString() });
    } else {
      setRoomState(r as Room);
    }
    setVotes((v ?? []) as Vote[]);
    setLoading(false);
  }, [room]);

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel(`room:${room}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes", filter: `room=eq.${room}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `room=eq.${room}` }, () => loadAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [room, loadAll]);

  const join = async () => {
    const n = name.trim();
    if (!n) return;
    const { error } = await supabase
      .from("votes")
      .upsert({ room, member_id: meId, member_name: n, card: null }, { onConflict: "room,member_id" });
    if (error) { setError(error.message); return; }
    setJoined(true);
  };

  const castVote = async (card: string) => {
    if (roomState?.revealed) return;
    const mine = votes.find((v) => v.member_id === meId);
    const next = mine?.card === card ? null : card;
    const { error } = await supabase
      .from("votes")
      .upsert({ room, member_id: meId, member_name: nameRef.current.trim(), card: next }, { onConflict: "room,member_id" });
    if (error) setError(error.message);
  };

  const setTitle = async (title: string) => {
    await supabase.from("rooms").upsert({ room, story_title: title });
  };

  const reveal = async () => {
    await supabase.from("rooms").upsert({ room, revealed: true });
  };

  const newRound = async () => {
    await supabase.from("rooms").upsert({ room, revealed: false, story_title: "" });
    await supabase.from("votes").update({ card: null }).eq("room", room);
  };

  const leave = async () => {
    await supabase.from("votes").delete().eq("room", room).eq("member_id", meId);
    setJoined(false);
  };

  const votedCount = votes.filter((v) => v.card != null).length;
  const myVote = votes.find((v) => v.member_id === meId)?.card ?? null;
  const revealed = roomState?.revealed ?? false;
  const avg = revealed ? average(votes.map((v) => v.card)) : null;
  const allVoted = votes.length > 0 && votedCount === votes.length;

  const tally = useMemo(() => {
    const counts: Record<string, number> = {};
    votes.forEach((v) => { if (v.card != null) counts[v.card] = (counts[v.card] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [votes]);
  const consensus = revealed && tally.length === 1 && votes.length > 1;

  if (loading) return <div style={S.center}>Chargement de la salle…</div>;

  if (!joined) {
    return (
      <div style={S.joinWrap}>
        <h1 style={S.h1}>🃏 Poker Planning</h1>
        <p style={S.sub}>Salle « {room} » · estimation collaborative en temps réel.</p>
        <label style={S.label}>Ton prénom</label>
        <input
          style={S.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && join()}
          placeholder="Ex. Camille"
        />
        {error && <p style={S.error}>{error}</p>}
        <button style={{ ...S.btn, ...S.btnPrimary, marginTop: 16, width: "100%" }} onClick={join} disabled={!name.trim()}>
          Rejoindre la salle
        </button>
      </div>
    );
  }

  return (
    <div style={S.board}>
      <header style={S.header}>
        <div style={S.brand}>🃏 Poker Planning <span style={S.roomTag}>{room}</span></div>
        <div style={S.headerRight}>
          <span style={S.muted}>{name}</span>
          <button style={S.btnGhost} onClick={leave}>Quitter</button>
        </div>
      </header>

      {error && <div style={S.errorBar}>{error}</div>}

      <div style={S.card}>
        <label style={S.label}>User story / ticket à estimer</label>
        <input
          style={S.input}
          value={roomState?.story_title ?? ""}
          onChange={(e) => { setRoomState((r) => r ? { ...r, story_title: e.target.value } : r); }}
          onBlur={(e) => setTitle(e.target.value)}
          placeholder="Ex. PROJ-142 — Export CSV du tableau de bord"
        />
      </div>

      <div style={S.statusRow}>
        <span style={S.muted}>
          {votedCount} / {votes.length} ont voté{!revealed && allVoted ? " · prêt à révéler" : ""}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {!revealed ? (
            <button style={{ ...S.btn, ...S.btnGreen }} onClick={reveal} disabled={votedCount === 0}>Révéler</button>
          ) : (
            <button style={{ ...S.btn, ...S.btnPrimary }} onClick={newRound}>Nouveau tour</button>
          )}
        </div>
      </div>

      <div style={S.members}>
        {votes.map((v) => {
          const me = v.member_id === meId;
          return (
            <div key={v.member_id} style={{ ...S.member, borderColor: me ? "#6c5ce7" : "#2a2f3d" }}>
              <div style={{ ...S.memberCard, background: revealed ? "#fff" : v.card != null ? "#252140" : "#1e222e", color: revealed ? "#0f1117" : "#6c5ce7" }}>
                {revealed ? (v.card ?? "—") : v.card != null ? "✓" : ""}
              </div>
              <div style={S.memberName}>{v.member_name}{me ? " (toi)" : ""}</div>
            </div>
          );
        })}
      </div>

      {revealed && (
        <div style={{ ...S.results, borderColor: consensus ? "#1d9e75" : "#2a2f3d", background: consensus ? "#0f2a22" : "#171a23" }}>
          <div><div style={S.muted}>Moyenne</div><div style={S.avg}>{avg ?? "—"}</div></div>
          <div>
            <div style={S.muted}>Votes</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {tally.map(([c, n]) => <span key={c} style={S.pill}>{c} ×{n}</span>)}
            </div>
          </div>
          {consensus && <div style={S.consensus}>✓ Consensus</div>}
        </div>
      )}

      {!revealed && (
        <div style={{ marginTop: 24 }}>
          <div style={{ ...S.muted, marginBottom: 12 }}>Choisis ta carte</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {deck.cards.map((c) => (
              <button
                key={c}
                onClick={() => castVote(c)}
                style={{
                  ...S.playingCard,
                  borderColor: myVote === c ? "#6c5ce7" : "#2a2f3d",
                  background: myVote === c ? "#6c5ce7" : "#171a23",
                  color: myVote === c ? "#fff" : "#e8eaf0",
                  transform: myVote === c ? "translateY(-6px)" : "none",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#8b90a0" },
  joinWrap: { maxWidth: 420, margin: "80px auto", padding: "0 24px" },
  h1: { fontSize: 26, fontWeight: 600, margin: 0 },
  sub: { color: "#8b90a0", fontSize: 14, marginTop: 6, marginBottom: 28 },
  label: { display: "block", fontSize: 13, color: "#8b90a0", marginBottom: 6 },
  input: { width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, border: "1px solid #2a2f3d", background: "#171a23", color: "#e8eaf0", fontSize: 15, outline: "none" },
  error: { color: "#e24b4a", fontSize: 13, marginTop: 10 },
  errorBar: { background: "#e24b4a", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  board: { maxWidth: 880, margin: "0 auto", padding: "24px 24px 60px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  brand: { fontSize: 17, fontWeight: 600 },
  roomTag: { fontSize: 12, color: "#8b90a0", padding: "3px 8px", background: "#171a23", borderRadius: 6, border: "1px solid #2a2f3d", marginLeft: 8 },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  muted: { color: "#8b90a0", fontSize: 13 },
  card: { background: "#171a23", border: "1px solid #2a2f3d", borderRadius: 12, padding: 16, marginBottom: 20 },
  statusRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 },
  btn: { padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#fff" },
  btnPrimary: { background: "#6c5ce7" },
  btnGreen: { background: "#1d9e75" },
  btnGhost: { fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid #2a2f3d", background: "transparent", color: "#8b90a0", cursor: "pointer" },
  members: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginBottom: 24 },
  member: { background: "#171a23", border: "1px solid #2a2f3d", borderRadius: 12, padding: "14px 12px", textAlign: "center" },
  memberCard: { height: 64, borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 },
  memberName: { fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  results: { borderRadius: 12, border: "1px solid", padding: 20, marginBottom: 8, display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" },
  avg: { fontSize: 30, fontWeight: 700 },
  pill: { padding: "3px 9px", background: "#1e222e", borderRadius: 6, fontSize: 13 },
  consensus: { marginLeft: "auto", color: "#1d9e75", fontWeight: 600 },
  playingCard: { width: 58, height: 84, borderRadius: 10, cursor: "pointer", fontSize: 19, fontWeight: 700, border: "1.5px solid", transition: "transform .12s ease" },
};
