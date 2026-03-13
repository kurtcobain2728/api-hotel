import { FilterQuery, SortOrder } from 'mongoose';
import { RoomModel, IRoom, RoomStatus } from '../models/room.model';
import { CreateRoomDTO, UpdateRoomDTO, RoomFilters } from '../validators/room.validator';
import { NotFoundError, ConflictError } from '../utils/apiError';
import {
  PaginatedResult,
  PaginationParams,
  calcSkip,
  buildPaginatedResult,
} from '../utils/pagination';

export class RoomService {
  async createRoom(data: CreateRoomDTO): Promise<IRoom> {
    const existing = await RoomModel.findOne({ roomNumber: data.roomNumber });
    if (existing) {
      throw new ConflictError(`Room with number ${data.roomNumber} already exists`);
    }

    const room = new RoomModel(data);
    await room.save();
    return room;
  }

  async findRoomById(id: string): Promise<IRoom> {
    const room = await RoomModel.findById(id);
    if (!room) {
      throw new NotFoundError('Room', id);
    }
    return room;
  }

  async findRooms(
    filters: RoomFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<IRoom>> {
    const query: FilterQuery<IRoom> = {};

    // Apply filters
    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.available) {
      query.status = RoomStatus.AVAILABLE;
    }
    if (filters.minPrice !== undefined) {
      query.price = { ...((query.price as object) || {}), $gte: filters.minPrice };
    }
    if (filters.maxPrice !== undefined) {
      query.price = { ...((query.price as object) || {}), $lte: filters.maxPrice };
    }
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [{ roomNumber: searchRegex }, { description: searchRegex }];
    }

    // Sort
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection: SortOrder = filters.sortOrder === 'desc' ? -1 : 1;
    const sortObj: Record<string, SortOrder> = { [sortField]: sortDirection };

    const skip = calcSkip(pagination.page, pagination.limit);
    const [data, total] = await Promise.all([
      RoomModel.find(query).sort(sortObj).skip(skip).limit(pagination.limit),
      RoomModel.countDocuments(query),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  async updateRoom(id: string, data: UpdateRoomDTO): Promise<IRoom> {
    const room = await RoomModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!room) {
      throw new NotFoundError('Room', id);
    }
    return room;
  }

  async deleteRoom(id: string): Promise<void> {
    const room = await RoomModel.findByIdAndDelete(id);
    if (!room) {
      throw new NotFoundError('Room', id);
    }
  }

  async updateRoomStatus(id: string, status: RoomStatus): Promise<IRoom> {
    const room = await RoomModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );
    if (!room) {
      throw new NotFoundError('Room', id);
    }
    return room;
  }
}

export const roomService = new RoomService();
