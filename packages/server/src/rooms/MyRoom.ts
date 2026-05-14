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

  onCreate(options: { roomTitle?: unknown }) {
    console.log(`Create room: ${this.roomId}`);
    const raw = options?.roomTitle;
    const title = typeof raw === 'string' ? raw.trim().slice(0, 64) : '';
    this.state.roomTitle = title || '未命名房間';
  }

  onJoin(client: Client, _options: unknown) {
    console.log(client.sessionId, 'joined!');
    const player = new Player();
    player.isHost = this.state.players.size === 0;
    this.state.players.set(client.sessionId, player);
  }

  onDrop(client: Client, code?: number) {
    console.log(client.sessionId, 'dropped', code);
    this.allowReconnection(client, 60);
  }

  onReconnect(client: Client) {
    console.log(client.sessionId, 'reconnected');
  }

  async onLeave(client: Client, code: CloseCode) {
    console.log(client.sessionId, 'left!', code);
    // if (code !== CloseCode.CONSENTED) {
    //   try {
    //     // Wait for reconnection
    //     await this.allowReconnection(client, 30);
    //     console.log('Client reconnected!');
    //     return; // Don't clean up, client is back
    //   } catch (e) {
    //     // Reconnection failed or timed out
    //   }
    // }
    // Clean up player
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    /**
     * Called when the room is disposed.
     */
    console.log(`Dispose room: ${this.roomId}`);
  }
}
