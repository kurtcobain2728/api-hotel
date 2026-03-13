import { FilterQuery, SortOrder } from 'mongoose';
import { BookingModel, IBooking, BookingStatus } from '../models/booking.model';
import { RoomModel, RoomStatus } from '../models/room.model';
import { GuestModel } from '../models/guest.model';
import {
  CreateBookingDTO,
  UpdateBookingDTO,
  BookingFilters,
} from '../validators/booking.validator';
import { NotFoundError, ConflictError, ValidationError } from '../utils/apiError';
import {
  PaginatedResult,
  PaginationParams,
  calcSkip,
  buildPaginatedResult,
} from '../utils/pagination';

export class BookingService {
  async createBooking(data: CreateBookingDTO): Promise<IBooking> {
    // Validate guest exists
    const guest = await GuestModel.findById(data.guestId);
    if (!guest) {
      throw new ValidationError(`Guest with id ${data.guestId} not found`);
    }

    // Validate room exists
    const room = await RoomModel.findById(data.roomId);
    if (!room) {
      throw new ValidationError(`Room with id ${data.roomId} not found`);
    }

    // Check room availability for the date range
    const isAvailable = await this.checkRoomAvailability(
      data.roomId,
      data.checkInDate,
      data.checkOutDate,
    );
    if (!isAvailable) {
      throw new ConflictError(
        `Room ${room.roomNumber} is not available between ${data.checkInDate.toISOString().split('T')[0]} and ${data.checkOutDate.toISOString().split('T')[0]}`,
      );
    }

    // Calculate total price: price per night * number of nights
    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil((data.checkOutDate.getTime() - data.checkInDate.getTime()) / msPerDay);
    const totalPrice = room.price * nights;

    const booking = new BookingModel({
      guest: data.guestId,
      room: data.roomId,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      numberOfGuests: data.numberOfGuests,
      specialRequests: data.specialRequests,
      totalPrice,
      status: BookingStatus.PENDING,
    });

    await booking.save();

    // Populate guest and room before returning
    await booking.populate('guest');
    await booking.populate('room');

    return booking;
  }

  async findBookingById(id: string): Promise<IBooking> {
    const booking = await BookingModel.findById(id).populate('guest').populate('room');
    if (!booking) {
      throw new NotFoundError('Booking', id);
    }
    return booking;
  }

  async findBookings(
    filters: BookingFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<IBooking>> {
    const query: FilterQuery<IBooking> = {};

    if (filters.guestId) {
      query.guest = filters.guestId;
    }
    if (filters.roomId) {
      query.room = filters.roomId;
    }
    if (filters.status) {
      query.status = filters.status;
    }

    // Filter by check-in date (same day UTC)
    if (filters.checkInDate) {
      const date = new Date(filters.checkInDate);
      const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
      query.checkInDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Filter by check-out date (same day UTC)
    if (filters.checkOutDate) {
      const date = new Date(filters.checkOutDate);
      const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
      query.checkOutDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Sort
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection: SortOrder = filters.sortOrder === 'desc' ? -1 : 1;
    const sortObj: Record<string, SortOrder> = { [sortField]: sortDirection };

    const skip = calcSkip(pagination.page, pagination.limit);
    const [data, total] = await Promise.all([
      BookingModel.find(query)
        .populate('guest', 'firstName lastName email')
        .populate('room', 'roomNumber type price')
        .sort(sortObj)
        .skip(skip)
        .limit(pagination.limit),
      BookingModel.countDocuments(query),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  async updateBooking(id: string, data: UpdateBookingDTO): Promise<IBooking> {
    const booking = await BookingModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('guest')
      .populate('room');

    if (!booking) {
      throw new NotFoundError('Booking', id);
    }

    return booking;
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<IBooking> {
    const booking = await BookingModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    )
      .populate('guest')
      .populate('room');

    if (!booking) {
      throw new NotFoundError('Booking', id);
    }

    // Update room status based on booking status
    if (status === BookingStatus.CHECKED_IN) {
      await RoomModel.findByIdAndUpdate(booking.room, { status: RoomStatus.OCCUPIED });
    } else if (status === BookingStatus.CHECKED_OUT) {
      await RoomModel.findByIdAndUpdate(booking.room, { status: RoomStatus.CLEANING });
    }

    return booking;
  }

  async cancelBooking(id: string): Promise<IBooking> {
    const booking = await BookingModel.findByIdAndUpdate(
      id,
      { status: BookingStatus.CANCELLED },
      { new: true, runValidators: true },
    )
      .populate('guest')
      .populate('room');

    if (!booking) {
      throw new NotFoundError('Booking', id);
    }

    return booking;
  }

  async checkRoomAvailability(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
  ): Promise<boolean> {
    const query: FilterQuery<IBooking> = {
      room: roomId,
      status: {
        $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
      },
      // Overlap detection: existing booking overlaps if
      // existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckIn
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn },
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflicting = await BookingModel.findOne(query);
    return !conflicting;
  }
}

export const bookingService = new BookingService();
