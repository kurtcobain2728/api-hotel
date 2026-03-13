import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGuest extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  documentType?: string;
  documentNumber?: string;
  dateOfBirth?: Date;
  nationality?: string;
  fullName: string; // virtual
  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<IGuest>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    documentType: {
      type: String,
      trim: true,
    },
    documentNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    dateOfBirth: {
      type: Date,
    },
    nationality: {
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

// Virtual: fullName
guestSchema.virtual('fullName').get(function (this: IGuest) {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes (email unique index is already created by `unique: true` on the field)
// documentNumber sparse index is already created by `sparse: true` on the field
guestSchema.index({ lastName: 1 });

export const GuestModel: Model<IGuest> = mongoose.model<IGuest>('Guest', guestSchema);
