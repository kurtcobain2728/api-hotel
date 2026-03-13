import { Router } from 'express';
import { roomController } from '../controllers/room.controller';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createRoomSchema,
  updateRoomSchema,
  updateRoomStatusSchema,
  roomFiltersSchema,
} from '../validators/room.validator';

export const roomRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         roomNumber:
 *           type: string
 *           example: "101"
 *         type:
 *           type: string
 *           enum: [single, double, suite, deluxe]
 *           example: "double"
 *         price:
 *           type: number
 *           example: 150
 *         status:
 *           type: string
 *           enum: [disponible, ocupada, mantenimiento, limpieza]
 *           example: "disponible"
 *         description:
 *           type: string
 *           example: "Spacious room with ocean view"
 *         capacity:
 *           type: integer
 *           example: 2
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["WiFi", "TV", "Minibar"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateRoom:
 *       type: object
 *       required:
 *         - roomNumber
 *         - type
 *         - price
 *         - capacity
 *       properties:
 *         roomNumber:
 *           type: string
 *           example: "101"
 *         type:
 *           type: string
 *           enum: [single, double, suite, deluxe]
 *           example: "double"
 *         price:
 *           type: number
 *           minimum: 0.01
 *           example: 150
 *         description:
 *           type: string
 *           example: "Spacious room with ocean view"
 *         capacity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["WiFi", "TV"]
 *     UpdateRoom:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [single, double, suite, deluxe]
 *         price:
 *           type: number
 *           minimum: 0.01
 *         status:
 *           type: string
 *           enum: [disponible, ocupada, mantenimiento, limpieza]
 *         description:
 *           type: string
 *         capacity:
 *           type: integer
 *           minimum: 1
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *     UpdateRoomStatus:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [disponible, ocupada, mantenimiento, limpieza]
 *           example: "mantenimiento"
 */

/**
 * @swagger
 * /api/v1/rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoom'
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       409:
 *         description: Room number already exists
 */
roomRouter.post('/', validateRequest({ body: createRoomSchema }), roomController.create);

/**
 * @swagger
 * /api/v1/rooms:
 *   get:
 *     summary: List all rooms with filters and pagination
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [single, double, suite, deluxe]
 *         description: Filter by room type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [disponible, ocupada, mantenimiento, limpieza]
 *         description: Filter by status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: available
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter available rooms only
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in room number and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, roomNumber, createdAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Room'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
roomRouter.get('/', validateRequest({ query: roomFiltersSchema }), roomController.findAll);

/**
 * @swagger
 * /api/v1/rooms/{id}:
 *   get:
 *     summary: Get a room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Room not found
 */
roomRouter.get('/:id', roomController.findById);

/**
 * @swagger
 * /api/v1/rooms/{id}:
 *   put:
 *     summary: Update a room
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoom'
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       404:
 *         description: Room not found
 */
roomRouter.put('/:id', validateRequest({ body: updateRoomSchema }), roomController.update);

/**
 * @swagger
 * /api/v1/rooms/{id}:
 *   delete:
 *     summary: Delete a room
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       204:
 *         description: Room deleted successfully
 *       404:
 *         description: Room not found
 */
roomRouter.delete('/:id', roomController.delete);

/**
 * @swagger
 * /api/v1/rooms/{id}/status:
 *   patch:
 *     summary: Update room status
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoomStatus'
 *     responses:
 *       200:
 *         description: Room status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       404:
 *         description: Room not found
 */
roomRouter.patch(
  '/:id/status',
  validateRequest({ body: updateRoomStatusSchema }),
  roomController.updateStatus,
);
