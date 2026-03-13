import { FilterQuery, SortOrder } from 'mongoose';
import { GuestModel, IGuest } from '../models/guest.model';
import { CreateGuestDTO, UpdateGuestDTO, GuestFilters } from '../validators/guest.validator';
import { NotFoundError, ConflictError } from '../utils/apiError';
import {
  PaginatedResult,
  PaginationParams,
  calcSkip,
  buildPaginatedResult,
} from '../utils/pagination';

export class GuestService {
  async createGuest(data: CreateGuestDTO): Promise<IGuest> {
    const existing = await GuestModel.findOne({ email: data.email });
    if (existing) {
      throw new ConflictError(`Guest with email ${data.email} already exists`);
    }

    const guest = new GuestModel(data);
    await guest.save();
    return guest;
  }

  async findGuestById(id: string): Promise<IGuest> {
    const guest = await GuestModel.findById(id);
    if (!guest) {
      throw new NotFoundError('Guest', id);
    }
    return guest;
  }

  async findGuests(
    filters: GuestFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<IGuest>> {
    const query: FilterQuery<IGuest> = {};

    // Search in firstName, lastName, email
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }];
    }

    // Sort
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection: SortOrder = filters.sortOrder === 'desc' ? -1 : 1;
    const sortObj: Record<string, SortOrder> = { [sortField]: sortDirection };

    const skip = calcSkip(pagination.page, pagination.limit);
    const [data, total] = await Promise.all([
      GuestModel.find(query).sort(sortObj).skip(skip).limit(pagination.limit),
      GuestModel.countDocuments(query),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  async updateGuest(id: string, data: UpdateGuestDTO): Promise<IGuest> {
    if (data.email) {
      const existing = await GuestModel.findOne({ email: data.email, _id: { $ne: id } });
      if (existing) {
        throw new ConflictError(`Guest with email ${data.email} already exists`);
      }
    }

    const guest = await GuestModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!guest) {
      throw new NotFoundError('Guest', id);
    }
    return guest;
  }

  async deleteGuest(id: string): Promise<void> {
    const guest = await GuestModel.findByIdAndDelete(id);
    if (!guest) {
      throw new NotFoundError('Guest', id);
    }
  }
}

export const guestService = new GuestService();
