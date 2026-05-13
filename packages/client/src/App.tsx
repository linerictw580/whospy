import { useRoom, useRoomState } from '@colyseus/react';
import { Client } from '@colyseus/sdk';
import { MyRoomState } from '@whospy/shared/schema/MyRoomState';

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
  const { room, isConnecting } = useRoom<MyRoomState>(() =>
    client.joinOrCreate('my_room', {}, MyRoomState),
  );
  const state = useRoomState<MyRoomState>(room);

  if (isConnecting) {
    return <p>連線中...</p>;
  }

  if (!room) {
    return <p>尚未連到房間</p>;
  }

  if (!state) {
    return <p>尚未收到房間狀態</p>;
  }

  console.log(state.players);

  return (
    <>
      <p>已連線房間：{room.name}</p>
      <ul>
        {Object.entries(state.players).map(([sessionId, player]) => (
          <li key={sessionId}>
            {player.name || '(未命名玩家)'} ({sessionId})
          </li>
        ))}
      </ul>
    </>
  );
}
