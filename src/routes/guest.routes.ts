import { Router } from 'express';
import { guestController } from '../controllers/guest.controller';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createGuestSchema,
  updateGuestSchema,
  guestFiltersSchema,
} from '../validators/guest.validator';

export const guestRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Guest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         address:
 *           type: string
 *           example: "123 Main St, City"
 *         documentType:
 *           type: string
 *           example: "Pasaporte"
 *         documentNumber:
 *           type: string
 *           example: "AB123456"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1990-01-15"
 *         nationality:
 *           type: string
 *           example: "Mexican"
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateGuest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - phone
 *       properties:
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         address:
 *           type: string
 *         documentType:
 *           type: string
 *         documentNumber:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         nationality:
 *           type: string
 *     UpdateGuest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         documentType:
 *           type: string
 *         documentNumber:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         nationality:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/guests:
 *   post:
 *     summary: Create a new guest
 *     tags: [Guests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGuest'
 *     responses:
 *       201:
 *         description: Guest created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Guest'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
guestRouter.post('/', validateRequest({ body: createGuestSchema }), guestController.create);

/**
 * @swagger
 * /api/v1/guests:
 *   get:
 *     summary: List all guests with filters and pagination
 *     tags: [Guests]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [lastName, email, createdAt]
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
 *         description: List of guests
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
 *                     $ref: '#/components/schemas/Guest'
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
guestRouter.get('/', validateRequest({ query: guestFiltersSchema }), guestController.findAll);

/**
 * @swagger
 * /api/v1/guests/{id}:
 *   get:
 *     summary: Get a guest by ID (includes booking history)
 *     tags: [Guests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Guest ID
 *     responses:
 *       200:
 *         description: Guest found (with booking history)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Guest'
 *                     - type: object
 *                       properties:
 *                         bookings:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Booking'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Guest not found
 */
guestRouter.get('/:id', guestController.findById);

/**
 * @swagger
 * /api/v1/guests/{id}:
 *   put:
 *     summary: Update a guest
 *     tags: [Guests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Guest ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGuest'
 *     responses:
 *       200:
 *         description: Guest updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Guest'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       404:
 *         description: Guest not found
 */
guestRouter.put('/:id', validateRequest({ body: updateGuestSchema }), guestController.update);

/**
 * @swagger
 * /api/v1/guests/{id}:
 *   delete:
 *     summary: Delete a guest
 *     tags: [Guests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Guest ID
 *     responses:
 *       204:
 *         description: Guest deleted successfully
 *       404:
 *         description: Guest not found
 */
guestRouter.delete('/:id', guestController.delete);
