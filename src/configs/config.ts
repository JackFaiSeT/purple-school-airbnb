import { ConfigService } from '@nestjs/config';
import { ENVS } from 'src/constants';

export const getConfig = (configService: ConfigService) => {
	const user = configService.get<string>(ENVS.MONGO_USER) || 'admin';
	const pass = configService.get<string>(ENVS.MONGO_PASSWORD) || 'password';
	const host = configService.get<string>(ENVS.MONGO_HOST) || 'localhost';
	const port = configService.get<string>(ENVS.MONGO_PORT) || '27017';
	const db = configService.get<string>(ENVS.MONGO_DB) || 'mydatabase';
	const authDb = configService.get<string>(ENVS.MONGO_AUTH_DB) || 'admin';

	return {
		uri: `mongodb://${user}:${pass}@${host}:${port}/${db}?authSource=${authDb}`,
		autoIndex: false,
	};
};
