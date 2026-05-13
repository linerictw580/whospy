import { Room, Client, CloseCode } from 'colyseus';
import { MyRoomState, Player } from './schema/MyRoomState.js';

export class MyRoom extends Room {
  maxClients = 4;
  state = new MyRoomState();

  messages = {
    yourMessageType: (client: Client, message: unknown) => {
      /**
       * Handle "yourMessageType" message.
       */
      console.log(client.sessionId, 'sent a message:', message);
    },
  };

  onCreate(_options: unknown) {
    /**
     * Called when a new room is created.
     */
  }

  onJoin(client: Client, _options: unknown) {
    console.log(client.sessionId, 'joined!');
    this.state.players.set(client.sessionId, new Player());
  }

  onLeave(client: Client, code: CloseCode) {
    console.log(client.sessionId, 'left!', code);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    /**
     * Called when the room is disposed.
     */
    console.log('room', this.roomId, 'disposing...');
  }
}
