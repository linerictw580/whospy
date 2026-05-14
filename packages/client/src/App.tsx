import { useEffect } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  GameSession,
  RoomUrlSync,
  useRoom,
  useRoomState,
  useRoomAction,
} from './GameSession';

export default function App() {
  return (
    <main style={{ padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>WhoSpy</h1>
      <GameSession>
        <RoomUrlSync />
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/room/:roomId" element={<RoomGate />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GameSession>
    </main>
  );
}

function Lobby() {
  const { setRoomAction: setIntent } = useRoomAction();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/') {
      return;
    }
    setIntent(null);
  }, [location.pathname, setIntent]);

  return (
    <>
      <CreateRoomForm
        onSubmit={(roomTitle) =>
          setIntent({ type: 'create', roomTitle, nonce: Date.now() })
        }
      />
    </>
  );
}

function RoomGate() {
  const { roomId } = useParams();
  const id = roomId ?? '';
  const { action: intent, setRoomAction: setIntent } = useRoomAction();
  const { room, isConnecting, error } = useRoom();

  useEffect(() => {
    if (!id) {
      return;
    }
    if (room?.roomId === id) {
      return;
    }
    if (intent?.type === 'join' && intent.roomId === id) {
      return;
    }
    if (intent?.type === 'create') {
      return;
    }
    setIntent({ type: 'join', roomId: id });
  }, [id, room?.roomId, intent, setIntent]);

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (!room) {
    return (
      <>
        <p>
          <LobbyLink>← 回到大廳</LobbyLink>
        </p>
        {isConnecting ? <p>加入房間中…</p> : null}
        {error ? (
          <p role="alert" style={{ color: 'crimson' }}>
            無法加入房間：{error.message}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <>
      <p>
        <LobbyLink>← 回到大廳</LobbyLink>
      </p>
      <Game />
    </>
  );
}

function LobbyLink({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { setRoomAction: setIntent } = useRoomAction();
  return (
    <a
      href="/"
      onClick={(e) => {
        e.preventDefault();
        setIntent(null);
        navigate('/', { replace: true });
      }}
    >
      {children}
    </a>
  );
}

function CreateRoomForm({
  onSubmit,
}: {
  onSubmit: (roomTitle: string) => void;
}) {
  const location = useLocation();
  const { room, isConnecting, error } = useRoom();
  const atLobbyPath = location.pathname === '/';

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.elements.namedItem(
            'roomTitle',
          ) as HTMLInputElement;
          const title = input.value.trim();
          if (!title) {
            input.setCustomValidity('請填寫房間名稱');
            input.reportValidity();
            input.setCustomValidity('');
            return;
          }
          onSubmit(title);
        }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'flex-end',
          marginBottom: '1.25rem',
          maxWidth: '28rem',
        }}
      >
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            flex: '1 1 12rem',
          }}
        >
          <span>房間名稱</span>
          <input
            name="roomTitle"
            type="text"
            required
            maxLength={64}
            disabled={isConnecting}
            placeholder="輸入房間名稱"
            style={{ padding: '0.5rem 0.65rem', fontSize: '1rem' }}
          />
        </label>
        <button
          type="submit"
          disabled={isConnecting}
          style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
        >
          建立房間
        </button>
      </form>
      {isConnecting && atLobbyPath ? <p>建立房間中…</p> : null}
      {error && atLobbyPath ? (
        <p role="alert" style={{ color: 'crimson' }}>
          錯誤：{error.message}
        </p>
      ) : null}
      {room && atLobbyPath ? (
        <p style={{ color: 'dimgray', fontSize: '0.9rem' }}>正在導向房間…</p>
      ) : null}
    </>
  );
}

function Game() {
  const { room } = useRoom();
  const state = useRoomState();

  if (!room || !state) {
    return <p>尚未收到房間狀態</p>;
  }

  console.log(state.players);

  return (
    <>
      <p>
        分享此連結邀請其他人：
        <br />
        <code style={{ wordBreak: 'break-all' }}>
          {`${window.location.origin}/room/${room.roomId}`}
        </code>
      </p>
      <p>
        房間：{state.roomTitle || room.name}（房間代碼：{room.roomId}）
      </p>
      <ul>
        {Object.entries(state.players).map(([sessionId, player]) => (
          <li key={sessionId}>
            {player.name || '(未命名玩家)'}
            {player.isHost ? '（房主）' : ''}（{sessionId}）
          </li>
        ))}
      </ul>
    </>
  );
}
