import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { createRoomContext } from '@colyseus/react';
import { Client, CloseCode } from '@colyseus/sdk';
import { useLocation, useNavigate } from 'react-router-dom';
import { MyRoomState } from '@whospy/shared/schema/MyRoomState';
import {
  clearPersistedRoomSession,
  persistRoomSession,
  readPersistedRoomSession,
} from './room-session-storage';

const DEFAULT_COLYSEUS_URL = 'http://localhost:4527';

export const client = new Client(
  import.meta.env.VITE_COLYSEUS_URL ?? DEFAULT_COLYSEUS_URL,
);

export const { RoomProvider, useRoom, useRoomState } =
  createRoomContext<MyRoomState>();

export type RoomAction =
  | null
  | { type: 'create'; roomTitle: string; nonce: number }
  | { type: 'join'; roomId: string }
  | { type: 'reconnect'; reconnectionToken: string };

export function parseRoomIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/room\/([^/]+)\/?$/);
  return m?.[1] ?? null;
}

function initialActionFromPath(): RoomAction {
  const id = parseRoomIdFromPath(window.location.pathname);
  return id ? { type: 'join', roomId: id } : null;
}

function initialRoomAction(): RoomAction {
  const persisted = readPersistedRoomSession();
  if (persisted) {
    return {
      type: 'reconnect',
      reconnectionToken: persisted.reconnectionToken,
    };
  }
  return initialActionFromPath();
}

type RoomActionContextValue = {
  action: RoomAction;
  setAction: Dispatch<SetStateAction<RoomAction>>;
};

const RoomActionContext = createContext<RoomActionContextValue | null>(null);

export function useRoomAction() {
  const v = useContext(RoomActionContext);
  if (!v) {
    throw new Error('useRoomAction must be used within GameSession');
  }
  return v;
}

function ConnectLayer({ children }: { children: ReactNode }) {
  const { action } = useRoomAction();

  const connect = useMemo(() => {
    if (!action) {
      return null;
    }
    if (action.type === 'create') {
      return () =>
        client.create('my_room', { roomTitle: action.roomTitle }, MyRoomState);
    }
    if (action.type === 'reconnect') {
      return () =>
        client.reconnect<MyRoomState>(action.reconnectionToken, MyRoomState);
    }
    return () => client.joinById(action.roomId, {}, MyRoomState);
  }, [action]);

  const deps = useMemo(() => {
    if (!action) {
      return [];
    }
    if (action.type === 'create') {
      return [action.nonce];
    }
    if (action.type === 'reconnect') {
      return [action.reconnectionToken];
    }
    return [action.roomId];
  }, [action]);

  return (
    <RoomProvider connect={connect} deps={deps}>
      <ReconnectFallback />
      <RoomSessionPersistence />
      {children}
    </RoomProvider>
  );
}

/** Join by room ID (new connection) and clear expired session when cold reconnection fails. */
function ReconnectFallback() {
  const { action, setAction: setRoomAction } = useRoomAction();
  const { error, room, isConnecting } = useRoom();

  useEffect(() => {
    if (
      !error ||
      room ||
      isConnecting ||
      !action ||
      action.type !== 'reconnect'
    ) {
      return;
    }
    const persisted = readPersistedRoomSession();
    const storedRoomId =
      persisted?.roomId || action.reconnectionToken.split(':')[0] || '';
    clearPersistedRoomSession();
    if (storedRoomId) {
      setRoomAction({ type: 'join', roomId: storedRoomId });
    } else {
      setRoomAction(initialActionFromPath());
    }
  }, [action, error, isConnecting, room, setRoomAction]);

  return null;
}

function RoomSessionPersistence() {
  const { room } = useRoom();

  useEffect(() => {
    if (!room) {
      return;
    }
    const write = () => {
      persistRoomSession({
        roomId: room.roomId,
        sessionId: room.sessionId,
        reconnectionToken: room.reconnectionToken,
      });
    };
    write();
    const onReconnect = () => write();
    const onLeave = (code: number) => {
      if (
        code === CloseCode.CONSENTED ||
        code === CloseCode.FAILED_TO_RECONNECT
      ) {
        clearPersistedRoomSession();
      }
    };
    room.onReconnect(onReconnect);
    room.onLeave(onLeave);
    return () => {
      room.onReconnect.remove(onReconnect);
      room.onLeave.remove(onLeave);
    };
  }, [room]);

  return null;
}

/** Sync URL when the host creates a room while still on `/`. */
export function RoomUrlSync() {
  const { room } = useRoom();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!room) {
      return;
    }
    if (location.pathname === '/') {
      navigate(`/room/${room.roomId}`, { replace: true });
      return;
    }
    const urlId = parseRoomIdFromPath(location.pathname);
    if (urlId && urlId !== room.roomId) {
      navigate(`/room/${room.roomId}`, { replace: true });
    }
  }, [room, location.pathname, navigate]);

  return null;
}

export function GameSession({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<RoomAction>(initialRoomAction);

  const value = useMemo(
    () => ({ action: action, setAction: setAction }),
    [action, setAction],
  );

  useEffect(() => {
    if (action === null) {
      clearPersistedRoomSession();
    }
  }, [action]);

  return (
    <RoomActionContext.Provider value={value}>
      <ConnectLayer>{children}</ConnectLayer>
    </RoomActionContext.Provider>
  );
}
