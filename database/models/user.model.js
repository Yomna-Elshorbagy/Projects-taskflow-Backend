import mongoose, { Schema } from "mongoose";
import { gender, roles, status } from "../../utils/constant/enums.js";

let userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "last name must be at least 3 characters long"],
      maxlength: [70, "last name cannot exceed 70 characters"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    password: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      validate: {
        validator: /^01[01245]\d{8}$/,
        message: (props) => `${props.value} is not a valid mobile number!`,
      },
    },
    role: {
      type: String,
      enum: Object.values(roles),
      default: roles.USER,
    },
    gender: {
      type: String,
      enum: Object.values(gender),
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(status),
      default: status.PENDING,
    },
    image: {
      type: Object,
      default: {
        secure_url: process.env.SECURE_URL,
        public_id: process.env.PUBLIC_ID,
      },
    },
    address: String,
    otpCode: String,
    otpExpire: Date,
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


const User = mongoose.model("User", userSchema);
export default User;
