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
import { Client } from '@colyseus/sdk';
import { useLocation, useNavigate } from 'react-router-dom';
import { MyRoomState } from '@whospy/shared/schema/MyRoomState';

export const client = new Client('http://localhost:2567');

export const { RoomProvider, useRoom, useRoomState } =
  createRoomContext<MyRoomState>();

export type RoomAction =
  | null
  | { type: 'create'; roomTitle: string; nonce: number }
  | { type: 'join'; roomId: string };

export function parseRoomIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/room\/([^/]+)\/?$/);
  return m?.[1] ?? null;
}

function initialActionFromPath(): RoomAction {
  const id = parseRoomIdFromPath(window.location.pathname);
  return id ? { type: 'join', roomId: id } : null;
}

type RoomActionContextValue = {
  action: RoomAction;
  setRoomAction: Dispatch<SetStateAction<RoomAction>>;
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
    return () => client.joinById(action.roomId, {}, MyRoomState);
  }, [action]);

  const deps = useMemo(() => {
    if (!action) {
      return [];
    }
    if (action.type === 'create') {
      return [action.nonce];
    }
    return [action.roomId];
  }, [action]);

  return (
    <RoomProvider connect={connect} deps={deps}>
      {children}
    </RoomProvider>
  );
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
  const [action, setAction] = useState<RoomAction>(initialActionFromPath);

  const value = useMemo(
    () => ({ action: action, setRoomAction: setAction }),
    [action, setAction],
  );

  return (
    <RoomActionContext.Provider value={value}>
      <ConnectLayer>{children}</ConnectLayer>
    </RoomActionContext.Provider>
  );
}
