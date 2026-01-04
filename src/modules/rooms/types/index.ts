import { HydratedDocument } from 'mongoose';
import { Room } from '../entities/room.entity';

export * from './room-types';

export type RoomDocument = HydratedDocument<Room>;
