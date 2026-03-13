import { Request, Response } from 'express';
import { roomService } from '../services/room.service';
import { asyncHandler } from '../utils/asyncHandler';

export const roomController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const room = await roomService.createRoom(req.body);
    res.status(201).json({
      success: true,
      data: room,
      timestamp: new Date().toISOString(),
    });
  }),

  findById: asyncHandler(async (req: Request, res: Response) => {
    const room = await roomService.findRoomById(req.params.id as string);
    res.status(200).json({
      success: true,
      data: room,
      timestamp: new Date().toISOString(),
    });
  }),

  findAll: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...filters } = res.locals.validatedQuery || req.query;
    const result = await roomService.findRooms(
      filters as Parameters<typeof roomService.findRooms>[0],
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
    const room = await roomService.updateRoom(req.params.id as string, req.body);
    res.status(200).json({
      success: true,
      data: room,
      timestamp: new Date().toISOString(),
    });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await roomService.deleteRoom(req.params.id as string);
    res.status(204).send();
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const room = await roomService.updateRoomStatus(req.params.id as string, req.body.status);
    res.status(200).json({
      success: true,
      data: room,
      timestamp: new Date().toISOString(),
    });
  }),
};
