import { Types } from "mongoose";
import { z } from "zod";
import { AppError } from "../../utils/catch-error.js";

const validateObject = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "invalid ObjectId",
});

const passPattern = /^[A-Z][A-Za-z0-9]{5,20}$/;
const mobileNumberPattern = /^01[01245]\d{8}$/;

export const generalFields = {
  name: z.string().min(3).max(70),
  title: z.string(),
  description: z.string().min(20).max(2000),
  email: z.string().email(),
  password: z.string().regex(passPattern, "invalid password pattern"),
  Cpassword: z.string(),
  mobileNumber: z.string().regex(mobileNumberPattern, "invalid mobile number pattern"),
  objectId: validateObject,
};

export const validate = (schema) => {
  return (req, res, next) => {
    let data = { ...req.body, ...req.params, ...req.query };
    const result = schema.safeParse(data);
    
    if (result.success) {
      next();
    } else {
      let errMsg = result.error.issues.map((err) => err.message);
      next(new AppError(errMsg.join(", "), 400));
    }
  };
};
