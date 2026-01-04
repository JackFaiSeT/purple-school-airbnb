import { HydratedDocument } from 'mongoose';
import { Schedule } from '../entities/schedule.entity';

export type ScheduleDocument = HydratedDocument<Schedule>;
