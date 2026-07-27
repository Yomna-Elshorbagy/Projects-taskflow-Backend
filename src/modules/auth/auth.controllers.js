import { generateOTP } from "../../../utils/otp.js";
import * as authRepo from "./auth.reposatory.js";
import { AppError, catchAsyncError } from "../../../utils/catch-error.js";
import { messages } from "../../../utils/constant/messages.js";
import { comparePass, hashedPass } from "../../../utils/hash-compare.js";
import { generateToken } from "../../../utils/token.js";
import { status } from "../../../utils/constant/enums.js";

export const signup = catchAsyncError(async (req, res, next) => {
  let {
    userName,
    email,
    password,
    Cpassword,
    gender,
    mobileNumber,
  } = req.body;

  if (password !== Cpassword) {
    return next(new AppError("password and confirmed password doesn't Match", 401));
  }

  const userExisting = await authRepo.findUserByEmailOrMobile(email, mobileNumber);
  if (userExisting) return next(new AppError(messages.user.alreadyExist, 409));

  const hashedpassword = hashedPass({
    password,
    saltRounds: Number(process.env.SALT_ROUNDS),
  });

  const { otpCode, otpExpire } = generateOTP();

  let createdUser = await authRepo.createUser({
    userName,
    email,
    password: hashedpassword,
    gender,
    mobileNumber,
    otpCode,
    otpExpire,
    status: status.VERIFIED,
    isVerified: true,
    passwordChangedAt: Date.now(),
  });

  if (!createdUser) return next(new AppError(messages.user.failToCreate, 500));

  const accessToken = await generateToken({
    payload: {
      _id: createdUser._id,
      name: createdUser.userName,
      email: createdUser.email,
      role: createdUser.role,
    },
  });

  await authRepo.createToken({
    token: accessToken,
    userId: createdUser._id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  createdUser.password = undefined;

  return res.status(201).json({
    message: messages.user.createdSuccessfully,
    success: true,
    data: createdUser,
    accessToken,
  });
});

export const logIn = catchAsyncError(async (req, res, next) => {
  let { email, mobileNumber, password } = req.body;
  
  const userExist = await authRepo.findUserByEmailOrMobile(email, mobileNumber, { status: status.VERIFIED });
  
  if (!userExist) {
    return next(new AppError(messages.user.invalidCredential, 401));
  }
  
  const isMatch = comparePass({
    password: password.trim(),
    hashPass: userExist.password,
  });

  if (!isMatch) {
    return next(new AppError(messages.user.invalidCredential, 401));
  }

  const accessToken = await generateToken({
    payload: {
      _id: userExist._id,
      name: userExist.userName,
      email: userExist.email,
      role: userExist.role,
    },
  });
  
  await authRepo.createToken({
    token: accessToken,
    userId: userExist._id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.json({
    message: messages.user.loggedInSuccessfully,
    success: true,
    accessToken,
  });
});


export const logout = catchAsyncError(async (req, res, next) => {
  const { authentication } = req.headers;
  if (!authentication) return next(new AppError("please signIn first", 401));
  let [key, token] = authentication.split(" ");
  
  await authRepo.invalidateToken(token, req.authUser._id);
  
  res.json({
    message: messages.user.loggedOutSuccessfully,
    success: true,
  });
});