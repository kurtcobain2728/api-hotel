import { Request, Response } from 'express';
import { guestService } from '../services/guest.service';
import { BookingModel } from '../models/booking.model';
import { asyncHandler } from '../utils/asyncHandler';

export const guestController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const guest = await guestService.createGuest(req.body);
    res.status(201).json({
      success: true,
      data: guest,
      timestamp: new Date().toISOString(),
    });
  }),

  findById: asyncHandler(async (req: Request, res: Response) => {
    const guest = await guestService.findGuestById(req.params.id as string);

    // Include booking history
    const bookings = await BookingModel.find({ guest: req.params.id as string })
      .populate('room', 'roomNumber type price')
      .sort({ checkInDate: -1 });

    const guestObj = guest.toJSON();

    res.status(200).json({
      success: true,
      data: {
        ...guestObj,
        bookings,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  findAll: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...filters } = res.locals.validatedQuery || req.query;
    const result = await guestService.findGuests(
      filters as Parameters<typeof guestService.findGuests>[0],
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
    const guest = await guestService.updateGuest(req.params.id as string, req.body);
    res.status(200).json({
      success: true,
      data: guest,
      timestamp: new Date().toISOString(),
    });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await guestService.deleteGuest(req.params.id as string);
    res.status(204).send();
  }),
};
