import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { BookingStatus } from '../models/booking.model';
import { asyncHandler } from '../utils/asyncHandler';

export const bookingController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.createBooking(req.body);
    res.status(201).json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString(),
    });
  }),

  findById: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.findBookingById(req.params.id as string);
    res.status(200).json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString(),
    });
  }),

  findAll: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...filters } = res.locals.validatedQuery || req.query;
    const result = await bookingService.findBookings(
      filters as Parameters<typeof bookingService.findBookings>[0],
      { page: page as number, limit: limit as number },
    );
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.updateBooking(req.params.id as string, req.body);
    res.status(200).json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString(),
    });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.cancelBooking(req.params.id as string);
    res.status(200).json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString(),
    });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.updateBookingStatus(
      req.params.id as string,
      req.body.status as BookingStatus,
    );
    res.status(200).json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString(),
    });
  }),
};
