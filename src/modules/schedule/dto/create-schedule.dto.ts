import { IsDateString, IsMongoId } from 'class-validator';

export class CreateScheduleDto {
	@IsMongoId()
	roomId: string;

	@IsDateString()
	date: string;
}
