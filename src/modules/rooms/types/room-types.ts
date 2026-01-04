import { ROOM_TYPES } from '../constants';

export type RoomType = (typeof ROOM_TYPES)[keyof typeof ROOM_TYPES];
