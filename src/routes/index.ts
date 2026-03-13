import { Router } from 'express';
import { roomRouter } from './room.routes';
import { guestRouter } from './guest.routes';
import { bookingRouter } from './booking.routes';
import { healthController } from '../controllers/health.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "ok"
 *                     database:
 *                       type: string
 *                       example: "connected"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       example: 12345.67
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Service is degraded (database disconnected)
 */
router.get('/health', healthController.check);

router.use('/rooms', roomRouter);
router.use('/guests', guestRouter);
router.use('/bookings', bookingRouter);

export default router;
