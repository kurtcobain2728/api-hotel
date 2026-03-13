import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { RoomStatus } from './room.model';

export enum BookingStatus {
  PENDING = 'pendiente',
  CONFIRMED = 'confirmada',
  CHECKED_IN = 'check-in',
  CHECKED_OUT = 'check-out',
  CANCELLED = 'cancelada',
}

export interface IBooking extends Document {
  guest: Types.ObjectId;
  room: Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  status: BookingStatus;
  totalPrice: number;
  numberOfGuests: number;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    guest: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest is required'],
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(BookingStatus),
        message: 'Status must be one of: pendiente, confirmada, check-in, check-out, cancelada',
      },
      default: BookingStatus.PENDING,
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price must be positive'],
    },
    numberOfGuests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Number of guests must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Number of guests must be an integer',
      },
    },
    specialRequests: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform(_doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform(_doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Validate checkOutDate > checkInDate
bookingSchema.pre('validate', function (next) {
  if (this.checkInDate && this.checkOutDate) {
    if (this.checkOutDate <= this.checkInDate) {
      this.invalidate('checkOutDate', 'Check-out date must be after check-in date');
    }
  }
  next();
});

// Post-save: update room status based on booking status changes
bookingSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;

  const RoomModel = mongoose.model('Room');

  if (doc.status === BookingStatus.CHECKED_IN) {
    await RoomModel.findByIdAndUpdate(doc.room, { status: RoomStatus.OCCUPIED });
  } else if (doc.status === BookingStatus.CHECKED_OUT) {
    await RoomModel.findByIdAndUpdate(doc.room, { status: RoomStatus.CLEANING });
  }
});

// Indexes
bookingSchema.index({ guest: 1 });
bookingSchema.index({ room: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ checkInDate: 1 });
bookingSchema.index({ checkOutDate: 1 });
bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 });

export const BookingModel: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);
