import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, disconnect, Types } from 'mongoose';
import { AppModule } from 'src/app.module';
import { Room } from 'src/modules/rooms';
import { ROOM_TYPES } from 'src/modules/rooms/constants';
import { ERRORS } from 'src/modules/rooms/constants/errors';
import { CreateRoomDto } from 'src/modules/rooms/dto/create-room.dto';
import { UpdateRoomDto } from 'src/modules/rooms/dto/update-room.dto';
import { RoomType } from 'src/modules/rooms/types';
import request from 'supertest';
import { App } from 'supertest/types';

let roomCounter = 100;
const getRoomData = (overrides?: Partial<CreateRoomDto>): CreateRoomDto => {
	return {
		roomNumber: roomCounter++,
		roomType: ROOM_TYPES.SINGLE,
		hasSeaView: false,
		...overrides,
	};
};

describe('Rooms (e2e)', () => {
	let app: INestApplication<App>;

	const httpRoom = {
		createRoom: async (payload: CreateRoomDto) => {
			return await request(app.getHttpServer()).post(`/rooms`).send(payload);
		},
		getRooms: async () => {
			return await request(app.getHttpServer()).get('/rooms');
		},
		getRoom: async (roomId: string) => {
			return await request(app.getHttpServer()).get(`/rooms/${roomId}`);
		},
		getRoomByNumber: async (roomNumber: number) => {
			return await request(app.getHttpServer()).get(`/rooms/byRoomNumber/${roomNumber}`);
		},
		patchRoom: async (rootId: string, updateRoomDto: UpdateRoomDto) => {
			return await request(app.getHttpServer()).patch(`/rooms/${rootId}`).send(updateRoomDto);
		},
		deleteRoom: async (roomId: string) => {
			return await request(app.getHttpServer()).delete(`/rooms/${roomId}`);
		},
		deleteByRoomNumber: async (roomNumber: number) => {
			return await request(app.getHttpServer()).delete(`/rooms/byRoomNumber/${roomNumber}`);
		},
	};

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

		await connection.dropCollection('rooms');
		await disconnect();
		await app.close();
	});

	beforeEach(async () => {
		const connection = app.get<Connection>(getConnectionToken());
		await connection.dropCollection('rooms');
	});

	describe('POST /rooms', () => {
		it('Should create a room (positive) and return created entity', async () => {
			const createDTO = getRoomData({ hasSeaView: true });

			const response = await httpRoom.createRoom(createDTO);
			const bodyResponse = response.body as Room;

			expect(response.status).toBe(HttpStatus.CREATED);
			expect(bodyResponse).toHaveProperty('_id');
			expect(bodyResponse.roomNumber).toBe(createDTO.roomNumber);
			expect(bodyResponse.roomType).toBe(createDTO.roomType);
			expect(bodyResponse.hasSeaView).toBe(createDTO.hasSeaView);
		});

		it('Should create a room without hasSeaView and default to false', async () => {
			const createDTO = getRoomData();

			const response = await httpRoom.createRoom(createDTO);
			const bodyResponse = response.body as Room;

			expect(response.status).toBe(HttpStatus.CREATED);
			expect(bodyResponse.roomNumber).toBe(createDTO.roomNumber);
			expect(bodyResponse.roomType).toBe(createDTO.roomType);
			expect(bodyResponse.hasSeaView).toBe(false);
		});

		it('Should reject negative roomNumber', async () => {
			const response = await httpRoom.createRoom(getRoomData({ roomNumber: -5 }));
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});

		it('Should reject non-integer roomNumber', async () => {
			const response = await httpRoom.createRoom(getRoomData({ roomNumber: 2.5 }));
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});

		it('Should reject invalid roomType', async () => {
			const response = await httpRoom.createRoom(getRoomData({ roomType: 'UNKNOWN' as RoomType }));
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});

		it('Should reject non-boolean hasSeaView', async () => {
			const response = await httpRoom.createRoom(
				getRoomData({ hasSeaView: 'yes' as unknown as boolean }),
			);
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});

		it('Should reject extra properties (whitelist)', async () => {
			const response = await httpRoom.createRoom(
				getRoomData({ bar: 'foo' } as Partial<CreateRoomDto>),
			);
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});

		it('Should accept valid payload', async () => {
			const createDTO = getRoomData();
			const response = await httpRoom.createRoom(createDTO);
			const bodyResponse = response.body as Room;

			expect(response.status).toBe(HttpStatus.CREATED);
			expect(bodyResponse.roomNumber).toBe(createDTO.roomNumber);
			expect(bodyResponse.roomType).toBe(createDTO.roomType);
			expect(bodyResponse.hasSeaView).toBe(createDTO.hasSeaView);
		});

		it('Should prevent duplicate roomNumber creation (409)', async () => {
			const createDTO = getRoomData();
			const firstResponse = await httpRoom.createRoom(createDTO);
			expect(firstResponse.status).toBe(HttpStatus.CREATED);

			const secondResponse = await httpRoom.createRoom(createDTO);
			const secondResponseBody = secondResponse.body as Room & { message?: string };
			expect(secondResponse.status).toBe(HttpStatus.CONFLICT);
			expect(secondResponseBody?.message).toBe(ERRORS.ROOM_ALREADY_EXISTS_ERROR);
		});
	});

	describe('GET /rooms', () => {
		it('Should return empty array when no rooms exist', async () => {
			const response = await httpRoom.getRooms();
			expect(response.status).toBe(HttpStatus.OK);
			expect(response.body).toEqual([]);
		});

		it('Should return all rooms', async () => {
			const firstCreateDTO = getRoomData();
			const secondCreateDTO = getRoomData();

			await httpRoom.createRoom(firstCreateDTO);
			await httpRoom.createRoom(secondCreateDTO);

			const response = await httpRoom.getRooms();
			expect(response.status).toBe(HttpStatus.OK);

			const bodyResponse = response.body as Room[];

			expect(bodyResponse.length).toBeGreaterThanOrEqual(2);

			bodyResponse.forEach((room: Room) => {
				expect(room).toHaveProperty('roomNumber');
				expect(room).toHaveProperty('roomType');
				expect(room).toHaveProperty('hasSeaView');
			});

			expect(bodyResponse).toEqual(
				expect.arrayContaining([
					expect.objectContaining(firstCreateDTO),
					expect.objectContaining(secondCreateDTO),
				]),
			);
		});
	});

	describe('GET /rooms/:id', () => {
		it('Should return a room by valid id', async () => {
			const createResponse = await httpRoom.createRoom(getRoomData());
			const room = createResponse.body as Room;

			const response = await httpRoom.getRoom(String(room._id));
			expect(response.status).toBe(HttpStatus.OK);
			expect(response.body).toMatchObject({
				_id: room._id,
				roomNumber: room.roomNumber,
				roomType: room.roomType,
				hasSeaView: room.hasSeaView,
			});
		});

		it('Should return 404 for non-existing id', async () => {
			const fakeId = new Types.ObjectId().toString();
			const response = await httpRoom.getRoom(fakeId);
			expect(response.status).toBe(HttpStatus.NOT_FOUND);
			expect((response.body as { message?: string })?.message).toBe(ERRORS.ROOM_NOT_FOUND_ERROR);
		});

		it('Should return 400 for invalid id format', async () => {
			const response = await httpRoom.getRoom('invalid-id');
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			expect((response.body as { message?: string })?.message).toBe('Invalid id format');
		});
	});

	describe('GET /rooms/byRoomNumber/:roomNumber', () => {
		it('Should return a room by valid roomNumber', async () => {
			const createResponse = await httpRoom.createRoom(getRoomData());
			const bodyResponse = createResponse.body as Room;
			const roomNumber = bodyResponse.roomNumber;

			const response = await httpRoom.getRoomByNumber(roomNumber);
			expect(response.status).toBe(HttpStatus.OK);
			expect(bodyResponse).toMatchObject({
				roomNumber: roomNumber,
				roomType: bodyResponse.roomType,
				hasSeaView: bodyResponse.hasSeaView,
			});
		});

		it('Should return 404 for non-existing roomNumber', async () => {
			const response = await httpRoom.getRoomByNumber(9999);
			expect(response.status).toBe(HttpStatus.NOT_FOUND);
			expect((response.body as { message?: string })?.message).toBe(ERRORS.ROOM_NOT_FOUND_ERROR);
		});

		it('Should return 400 for invalid roomNumber', async () => {
			const response = await httpRoom.getRoomByNumber('not-a-number' as unknown as number);
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			expect((response.body as { message?: string })?.message).toContain('Validation failed');
		});
	});

	describe('PATCH /rooms/:id', () => {
		it('Should update room fields successfully', async () => {
			const createResponse = await httpRoom.createRoom(getRoomData());
			const room = createResponse.body as Room;

			expect(createResponse.status).toBe(HttpStatus.CREATED);
			expect(room).toMatchObject({
				_id: room._id,
				hasSeaView: false,
			});

			const updateDTO = { hasSeaView: true };
			const response = await httpRoom.patchRoom(String(room._id), updateDTO);

			expect(response.status).toBe(HttpStatus.OK);
			expect(response.body).toMatchObject({
				_id: room._id,
				...updateDTO,
			});
		});

		it('Should return 409 when updating roomNumber to an existing one', async () => {
			const roomA = (await httpRoom.createRoom(getRoomData())).body as Room;
			const roomB = (await httpRoom.createRoom(getRoomData())).body as Room;

			const response = await httpRoom.patchRoom(String(roomB._id), {
				roomNumber: roomA.roomNumber,
			});

			expect(response.status).toBe(HttpStatus.CONFLICT);
			expect((response.body as { message?: string })?.message).toBe(
				ERRORS.ROOM_ALREADY_EXISTS_ERROR,
			);
		});

		it('Should return 404 when updating non-existing room', async () => {
			const nonExistingId = '507f1f77bcf86cd799439011';

			const response = await httpRoom.patchRoom(nonExistingId, { roomNumber: 600 });

			expect(response.status).toBe(HttpStatus.NOT_FOUND);
			expect((response.body as { message?: string })?.message).toBe(ERRORS.ROOM_NOT_FOUND_ERROR);
		});

		it('Should return 400 for invalid id format', async () => {
			const response = await httpRoom.patchRoom('invalid-id', { roomNumber: 600 });

			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			expect((response.body as { message?: string })?.message).toBe('Invalid id format');
		});

		it('Should return 400 for invalid update payload', async () => {
			const room = (await httpRoom.createRoom(getRoomData())).body as Room;
			const response = await httpRoom.patchRoom(String(room._id), { roomNumber: -10 });

			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			expect((response.body as { message?: string })?.message).toEqual(
				expect.arrayContaining(['roomNumber must be a positive number']),
			);
		});
	});

	describe('DELETE /rooms/:id', () => {
		it('Should remove a room by id successfully', async () => {
			const createResponse = await httpRoom.createRoom(getRoomData());
			const room = createResponse.body as Room;

			const deleteResponse = await httpRoom.deleteRoom(String(room._id));
			expect(deleteResponse.status).toBe(HttpStatus.OK);
		});

		it('Should return 404 when deleting by id that does not exist', async () => {
			const fakeId = new Types.ObjectId().toHexString();
			const response = await httpRoom.deleteRoom(fakeId);
			expect(response.status).toBe(HttpStatus.NOT_FOUND);
			expect((response.body as { message?: string })?.message).toBe(ERRORS.ROOM_NOT_FOUND_ERROR);
		});

		it('Should return 400 when deleting by invalid id format', async () => {
			const response = await httpRoom.deleteRoom('invalid-id');
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			expect((response.body as { message?: string })?.message).toBe('Invalid id format');
		});
	});

	describe('DELETE /rooms/byRoomNumber/:roomNumber', () => {
		it('Should remove a room by roomNumber successfully', async () => {
			const createResponse = await httpRoom.createRoom(getRoomData());
			const roomNumber = (createResponse.body as Room).roomNumber;

			const deleteResponse = await httpRoom.deleteByRoomNumber(roomNumber);
			expect(deleteResponse.status).toBe(HttpStatus.OK);
		});

		it('Should return 404 when deleting by roomNumber that does not exist', async () => {
			const response = await httpRoom.deleteByRoomNumber(-1);
			expect(response.status).toBe(HttpStatus.NOT_FOUND);
			expect((response.body as { message?: string })?.message).toBe(ERRORS.ROOM_NOT_FOUND_ERROR);
		});

		it('Should return 400 when deleting by invalid roomNumber', async () => {
			const response = await httpRoom.deleteByRoomNumber('not-a-number' as unknown as number);
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			expect((response.body as { message?: string })?.message).toContain('Validation failed');
		});
	});
});
