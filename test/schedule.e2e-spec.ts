import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, disconnect, Types } from 'mongoose';
import { AppModule } from 'src/app.module';
import { ERRORS } from 'src/modules/schedule/constants';
import { CreateScheduleDto } from 'src/modules/schedule/dto/create-schedule.dto';
import { FindScheduleDto } from 'src/modules/schedule/dto/find-schedule.dto';
import { UpdateScheduleDto } from 'src/modules/schedule/dto/update-schedule.dto';
import { Schedule } from 'src/modules/schedule/entities/schedule.entity';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Schedule (e2e)', () => {
	let app: INestApplication<App>;

	const httpSchedule = {
		create: (payload: CreateScheduleDto) =>
			request(app.getHttpServer()).post('/schedule').send(payload),

		findAll: (query?: FindScheduleDto) =>
			query
				? request(app.getHttpServer()).get('/schedule').query(query)
				: request(app.getHttpServer()).get('/schedule'),

		findOne: (id: string) => request(app.getHttpServer()).get(`/schedule/${id}`),

		update: (id: string, payload: UpdateScheduleDto) =>
			request(app.getHttpServer()).put(`/schedule/${id}`).send(payload),

		remove: (id: string) => request(app.getHttpServer()).delete(`/schedule/${id}`),
	};

	const createPayload = (overrides?: Partial<CreateScheduleDto>): CreateScheduleDto => ({
		roomId: new Types.ObjectId().toHexString(),
		date: new Date().toISOString(),
		...overrides,
	});

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
			}),
		);

		await app.init();
	});

	afterAll(async () => {
		const connection = app.get<Connection>(getConnectionToken());
		await connection.dropCollection('schedules');
		await disconnect();
		await app.close();
	});

	beforeEach(async () => {
		const connection = app.get<Connection>(getConnectionToken());
		await connection.dropCollection('schedules');
	});

	describe('POST /schedule', () => {
		it('Should create schedule (positive)', async () => {
			const payload = createPayload();

			const response = await httpSchedule.create(payload);
			const body = response.body as Schedule;

			expect(response.status).toBe(HttpStatus.CREATED);
			expect(body).toHaveProperty('_id');
			expect(body.roomId).toBe(payload.roomId);

			const date = new Date(payload.date);
			date.setUTCHours(0, 0, 0, 0);

			expect(body.date).toBe(new Date(date).toISOString());
		});

		it('Should normalize date to UTC midnight', async () => {
			const date = new Date('2025-01-10T15:45:00.000Z');
			const payload = createPayload({ date: date.toISOString() });

			const response = await httpSchedule.create(payload);
			const body = response.body as Schedule;

			const savedDate = new Date(body.date);
			expect(savedDate.getUTCHours()).toBe(0);
			expect(savedDate.getUTCMinutes()).toBe(0);
		});

		it('Should reject duplicate schedule for same room & date', async () => {
			const payload = createPayload();

			await httpSchedule.create(payload);
			const response = await httpSchedule.create(payload);

			expect(response.status).toBe(HttpStatus.CONFLICT);
			expect((response.body as { message?: string })?.message).toBe(
				ERRORS.ROOM_ALREADY_BOOKED_ERROR,
			);
		});

		it('Should reject invalid roomId', async () => {
			const response = await httpSchedule.create(createPayload({ roomId: 'invalid-id' }));

			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});

		it('Should reject invalid date format', async () => {
			const response = await httpSchedule.create(createPayload({ date: 'not-a-date' }));

			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});

		it('Should reject extra properties (whitelist)', async () => {
			const response = await httpSchedule.create({
				...createPayload(),
				foo: 'bar',
			} as unknown as CreateScheduleDto);

			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});
	});

	describe('GET /schedule', () => {
		it('Should return empty array when no schedules exist', async () => {
			const response = await httpSchedule.findAll();

			expect(response.status).toBe(HttpStatus.OK);
			expect(response.body).toEqual([]);
		});

		it('Should return all schedules', async () => {
			await httpSchedule.create(createPayload());
			await httpSchedule.create(createPayload());

			const response = await httpSchedule.findAll();

			expect(response.status).toBe(HttpStatus.OK);
			expect(Array.isArray(response.body)).toBe(true);
			expect((response.body as { length?: number })?.length).toBeGreaterThanOrEqual(2);
		});

		it('Should filter by roomId', async () => {
			const roomId = new Types.ObjectId().toHexString();

			await httpSchedule.create(createPayload({ roomId }));
			await httpSchedule.create(createPayload());

			const response = await httpSchedule.findAll({ roomId });

			expect(response.status).toBe(HttpStatus.OK);
			(response.body as Schedule[])?.forEach((item: Schedule) => expect(item.roomId).toBe(roomId));
		});

		it('Should filter by date', async () => {
			const date = '2025-01-15T00:00:00.000Z';

			await httpSchedule.create(createPayload({ date }));
			await httpSchedule.create(createPayload());

			const response = await httpSchedule.findAll({ date });

			expect(response.status).toBe(HttpStatus.OK);
			expect((response.body as { length?: number })?.length).toBe(1);
		});

		it('Should reject extra properties (whitelist)', async () => {
			const response = await httpSchedule.findAll({ foo: 'bar' });

			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});
	});

	describe('GET /schedule/:id', () => {
		it('Should return schedule by id', async () => {
			const payload = createPayload();
			const created = await httpSchedule.create(payload);
			const schedule = created.body as Schedule;

			const response = await httpSchedule.findOne(String(schedule._id));
			const body = response.body as Schedule;

			expect(response.status).toBe(HttpStatus.OK);
			expect(body._id).toBe(schedule._id);
			expect(body.roomId).toBe(schedule.roomId);
			expect(body.date).toBe(schedule.date);
		});

		it('Should return 404 for non-existing id', async () => {
			const id = new Types.ObjectId().toHexString();
			const response = await httpSchedule.findOne(id);

			expect(response.status).toBe(HttpStatus.NOT_FOUND);
			expect((response.body as { message?: string })?.message).toBe(
				ERRORS.SCHEDULE_NOT_FOUND_ERROR,
			);
		});

		it('Should return 400 for invalid id format', async () => {
			const response = await httpSchedule.findOne('invalid-id');

			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			expect((response.body as { message?: string })?.message).toBe('Invalid id format');
		});
	});

	describe('PUT /schedule/:id', () => {
		it('Should update schedule successfully', async () => {
			const created = await httpSchedule.create(createPayload());
			const schedule = created.body as Schedule;

			const newRoomId = new Types.ObjectId().toHexString();

			const response = await httpSchedule.update(String(schedule._id), {
				roomId: newRoomId,
				date: new Date().toISOString(),
			});

			expect(response.status).toBe(HttpStatus.OK);
			expect((response.body as Schedule)?.roomId).toBe(newRoomId);
		});

		it('Should prevent duplicate room+date on update', async () => {
			const payload = createPayload();

			await httpSchedule.create(payload);
			const conflictSchedule = (await httpSchedule.create(createPayload())).body as Schedule;

			const response = await httpSchedule.update(String(conflictSchedule._id), payload);

			expect(response.status).toBe(HttpStatus.CONFLICT);
			expect((response.body as { message?: string })?.message).toBe(
				ERRORS.ROOM_ALREADY_BOOKED_ERROR,
			);
		});

		it('Should return 404 when updating non-existing schedule', async () => {
			const id = new Types.ObjectId().toHexString();

			const response = await httpSchedule.update(id, createPayload());

			expect(response.status).toBe(HttpStatus.NOT_FOUND);
			expect((response.body as { message?: string })?.message).toBe(
				ERRORS.SCHEDULE_NOT_FOUND_ERROR,
			);
		});

		it('Should return 400 for invalid id format', async () => {
			const response = await httpSchedule.update('invalid-id', createPayload());

			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			expect((response.body as { message?: string })?.message).toBe('Invalid id format');
		});
	});

	describe('DELETE /schedule/:id', () => {
		it('Should delete schedule successfully', async () => {
			const created = await httpSchedule.create(createPayload());
			const schedule = created.body as Schedule;

			const response = await httpSchedule.remove(String(schedule._id));

			expect(response.status).toBe(HttpStatus.OK);
		});

		it('Should return 404 when deleting non-existing schedule', async () => {
			const id = new Types.ObjectId().toHexString();

			const response = await httpSchedule.remove(id);

			expect(response.status).toBe(HttpStatus.NOT_FOUND);
			expect((response.body as { message?: string })?.message).toBe(
				ERRORS.SCHEDULE_NOT_FOUND_ERROR,
			);
		});

		it('Should return 400 for invalid id format', async () => {
			const response = await httpSchedule.remove('invalid-id');

			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			expect((response.body as { message?: string })?.message).toBe('Invalid id format');
		});
	});
});
