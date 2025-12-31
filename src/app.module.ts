import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsModule } from './rooms/rooms.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
	imports: [RoomsModule, ScheduleModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
