import mongoose, { Schema, Document, Model } from 'mongoose';

export enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
  SUITE = 'suite',
  DELUXE = 'deluxe',
}

export enum RoomStatus {
  AVAILABLE = 'disponible',
  OCCUPIED = 'ocupada',
  MAINTENANCE = 'mantenimiento',
  CLEANING = 'limpieza',
}

export interface IRoom extends Document {
  roomNumber: string;
  type: RoomType;
  price: number;
  status: RoomStatus;
  description?: string;
  capacity: number;
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Room type is required'],
      enum: {
        values: Object.values(RoomType),
        message: 'Type must be one of: single, double, suite, deluxe',
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than 0'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(RoomStatus),
        message: 'Status must be one of: disponible, ocupada, mantenimiento, limpieza',
      },
      default: RoomStatus.AVAILABLE,
    },
    description: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Capacity must be an integer',
      },
    },
    amenities: {
      type: [String],
      default: [],
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

// Indexes (roomNumber unique index is already created by `unique: true` on the field)
roomSchema.index({ status: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ price: 1 });

export const RoomModel: Model<IRoom> = mongoose.model<IRoom>('Room', roomSchema);
