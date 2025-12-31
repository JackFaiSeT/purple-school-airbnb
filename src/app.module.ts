import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsModule } from './rooms/rooms.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
	imports: [
		ConfigModule.forRoot(),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const user = configService.get<string>('MONGO_USER') || 'admin';
				const pass = configService.get<string>('MONGO_PASSWORD') || 'password';
				const host = configService.get<string>('MONGO_HOST') || 'localhost';
				const port = configService.get<string>('MONGO_PORT') || '27017';
				const db = configService.get<string>('MONGO_DB') || 'mydatabase';
				const authDb = configService.get<string>('MONGO_AUTH_DB') || 'admin';

				return {
					uri: `mongodb://${user}:${pass}@${host}:${port}/${db}?authSource=${authDb}`,
					autoIndex: false,
				};
			},
		}),
		RoomsModule,
		ScheduleModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
