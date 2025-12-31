import { IsDateString, IsMongoId, IsOptional } from 'class-validator';

export class FindScheduleDto {
	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsMongoId()
	roomId?: string;
}
