import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  bookingFiltersSchema,
} from '../validators/booking.validator';

export const bookingRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         guest:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Guest'
 *         room:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Room'
 *         checkInDate:
 *           type: string
 *           format: date-time
 *           example: "2024-04-01T14:00:00.000Z"
 *         checkOutDate:
 *           type: string
 *           format: date-time
 *           example: "2024-04-05T11:00:00.000Z"
 *         status:
 *           type: string
 *           enum: [pendiente, confirmada, check-in, check-out, cancelada]
 *           example: "pendiente"
 *         totalPrice:
 *           type: number
 *           example: 600
 *         numberOfGuests:
 *           type: integer
 *           example: 2
 *         specialRequests:
 *           type: string
 *           example: "Late check-in requested"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateBooking:
 *       type: object
 *       required:
 *         - guestId
 *         - roomId
 *         - checkInDate
 *         - checkOutDate
 *         - numberOfGuests
 *       properties:
 *         guestId:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         roomId:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         checkInDate:
 *           type: string
 *           format: date
 *           example: "2024-04-01"
 *         checkOutDate:
 *           type: string
 *           format: date
 *           example: "2024-04-05"
 *         numberOfGuests:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         specialRequests:
 *           type: string
 *           example: "Late check-in requested"
 *     UpdateBooking:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pendiente, confirmada, check-in, check-out, cancelada]
 *         checkInDate:
 *           type: string
 *           format: date
 *         checkOutDate:
 *           type: string
 *           format: date
 *         numberOfGuests:
 *           type: integer
 *           minimum: 1
 *         specialRequests:
 *           type: string
 *     UpdateBookingStatus:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pendiente, confirmada, check-in, check-out, cancelada]
 *           example: "confirmada"
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBooking'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error (invalid data, guest/room not found)
 *       409:
 *         description: Room not available for the requested dates
 */
bookingRouter.post('/', validateRequest({ body: createBookingSchema }), bookingController.create);

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: List all bookings with filters and pagination
 *     tags: [Bookings]
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
 *         name: guestId
 *         schema:
 *           type: string
 *         description: Filter by guest ID
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *         description: Filter by room ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendiente, confirmada, check-in, check-out, cancelada]
 *         description: Filter by booking status
 *       - in: query
 *         name: checkInDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by check-in date
 *       - in: query
 *         name: checkOutDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by check-out date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [checkInDate, checkOutDate, totalPrice, createdAt]
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
 *         description: List of bookings
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
 *                     $ref: '#/components/schemas/Booking'
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
bookingRouter.get('/', validateRequest({ query: bookingFiltersSchema }), bookingController.findAll);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get a booking by ID (includes populated guest and room)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Booking not found
 */
bookingRouter.get('/:id', bookingController.findById);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBooking'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       404:
 *         description: Booking not found
 */
bookingRouter.put('/:id', validateRequest({ body: updateBookingSchema }), bookingController.update);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   delete:
 *     summary: Cancel a booking (soft delete - changes status to 'cancelada')
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Booking not found
 */
bookingRouter.delete('/:id', bookingController.delete);

/**
 * @swagger
 * /api/v1/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     description: >
 *       Updates the booking status. When status changes to 'check-in',
 *       the associated room status is automatically set to 'ocupada'.
 *       When status changes to 'check-out', the room status is set to 'limpieza'.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookingStatus'
 *     responses:
 *       200:
 *         description: Booking status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       404:
 *         description: Booking not found
 */
bookingRouter.patch(
  '/:id/status',
  validateRequest({ body: updateBookingStatusSchema }),
  bookingController.updateStatus,
);
