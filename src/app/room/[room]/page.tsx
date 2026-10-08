import PokerRoom from "@/components/PokerRoom";

export default function RoomPage({ params }: { params: { room: string } }) {
  return <PokerRoom room={decodeURIComponent(params.room)} />;
}
