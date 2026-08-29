import { z } from "zod";
import { generalFields } from "../../middelwares/validate.js";
import { gender } from "../../../utils/constant/enums.js";

export const signUpVal = z.object({
  userName: generalFields.name,
  email: generalFields.email,
  password: generalFields.password,
  Cpassword: generalFields.Cpassword,
  gender: z.enum(Object.values(gender)),
  mobileNumber: generalFields.mobileNumber,
}).refine((data) => data.password === data.Cpassword, {
  message: "password and confirmed password doesn't Match",
  path: ["Cpassword"],
});

export const logInVal = z.object({
  email: generalFields.email.optional(),
  mobileNumber: generalFields.mobileNumber.optional(),
  password: z.string(),
}).refine((data) => data.email || data.mobileNumber, {
  message: "Either email or mobile number must be provided",
  path: ["email"],
});

export const updateProfileVal = z.object({
  userName: generalFields.name.optional(),
  mobileNumber: generalFields.mobileNumber.optional(),
  address: z.string().optional(),
  gender: z.enum(Object.values(gender)).optional(),
});

