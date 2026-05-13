import { useRoom } from '@colyseus/react';
import { Client } from '@colyseus/sdk';

const client = new Client('http://localhost:2567');

export default function App() {
  return (
    <main style={{ padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>WhoSpy</h1>
      <Game />
    </main>
  );
}

function Game() {
  const { room, isConnecting } = useRoom(() => client.joinOrCreate('my_room'));

  if (isConnecting) {
    return <p>連線中...</p>;
  }

  if (!room) {
    return <p>尚未連到房間</p>;
  }

  return <p>已連線房間：{room.name}</p>;
}
