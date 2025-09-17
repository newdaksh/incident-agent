// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "../types";
import bcrypt from "bcryptjs";

interface UserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      minlength: 6,
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["viewer", "responder", "admin"],
      default: "viewer",
    },
    onCall: {
      type: Boolean,
      default: false,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    authProvider: {
      type: String,
      enum: ["local", "azure", "okta"],
      default: "local",
    },
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        slack: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
      dashboard: {
        defaultFilter: {
          type: String,
          default: "all",
        },
        autoRefresh: {
          type: Boolean,
          default: true,
        },
      },
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ onCall: 1 });

// Pre-save middleware to hash password
UserSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password!, 12);
    this.password = hashedPassword;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find on-call users
UserSchema.statics.findOnCall = function () {
  return this.find({ onCall: true });
};

// Static method to find users by role
UserSchema.statics.findByRole = function (role: string) {
  return this.find({ role });
};

// Virtual for user's full display info
UserSchema.virtual("displayName").get(function () {
  return `${this.name} (${this.email})`;
});

const User = mongoose.model<UserDocument>("User", UserSchema);

export default User;
export { UserDocument };
