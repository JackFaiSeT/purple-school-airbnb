import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('/api');
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);
	await app.listen(process.env.PORT ?? 3000);
}

bootstrap()
	.then(() => {
		console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
	})
	.catch((err) => {
		console.error('Error during application bootstrap:', err);
	});
