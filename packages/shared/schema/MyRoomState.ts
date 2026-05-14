import { MapSchema, Schema, type } from '@colyseus/schema';

export class Player extends Schema {
  @type('string') name: string = '';
  @type('boolean') isHost: boolean = false;
}

export class MyRoomState extends Schema {
  @type('string') roomTitle: string = '';
  @type({ map: Player }) players = new MapSchema<Player>();
}
