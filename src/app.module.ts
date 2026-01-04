import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { getConfig } from './configs';
import { RoomsModule } from './modules/rooms';
import { ScheduleModule } from './modules/schedule';

@Module({
	imports: [
		ConfigModule.forRoot(),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getConfig,
		}),
		RoomsModule,
		ScheduleModule,
	],
})
export class AppModule {}
