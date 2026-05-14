const ROOM_ID_KEY = 'whospy.roomId';
const SESSION_ID_KEY = 'whospy.sessionId';
const RECONNECTION_TOKEN_KEY = 'whospy.reconnectionToken';

export type PersistedRoomSession = {
  roomId: string;
  sessionId: string;
  /** `roomId:secret` — Colyseus `client.reconnect()` 所需格式 */
  reconnectionToken: string;
};

function isValidReconnectionToken(token: string): boolean {
  const [roomId, secret] = token.split(':');
  return Boolean(roomId && secret);
}

export function readPersistedRoomSession(): PersistedRoomSession | null {
  const reconnectionToken = sessionStorage.getItem(RECONNECTION_TOKEN_KEY);
  if (!reconnectionToken || !isValidReconnectionToken(reconnectionToken)) {
    return null;
  }
  return {
    roomId: sessionStorage.getItem(ROOM_ID_KEY) ?? '',
    sessionId: sessionStorage.getItem(SESSION_ID_KEY) ?? '',
    reconnectionToken,
  };
}

export function persistRoomSession(session: PersistedRoomSession): void {
  sessionStorage.setItem(ROOM_ID_KEY, session.roomId);
  sessionStorage.setItem(SESSION_ID_KEY, session.sessionId);
  sessionStorage.setItem(RECONNECTION_TOKEN_KEY, session.reconnectionToken);
}

export function clearPersistedRoomSession(): void {
  sessionStorage.removeItem(ROOM_ID_KEY);
  sessionStorage.removeItem(SESSION_ID_KEY);
  sessionStorage.removeItem(RECONNECTION_TOKEN_KEY);
}
