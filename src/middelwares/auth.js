import User from "../../database/models/user.model.js";
import { verifyToken } from "../../utils/token.js";
import { status } from "../../utils/constant/enums.js";
import { messages } from "../../utils/constant/messages.js";
import Token from "../../database/models/token.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { authentication } = req.headers;
  let result = "";
  if (!authentication) return next(new AppError(messages.user.signInRequired, 401));
  let [key, token] = authentication.split(" ");
  const validPrefixes = [
    process.env.TOKEN_PRIFEX1,
    process.env.TOKEN_PRIFEX2,
  ];
  if (!validPrefixes.includes(key)) {
    return next(new AppError("Invalid token prefix", 401));
  }
  //check token verification
   if (key === process.env.TOKEN_PRIFEX1) {
    result = await verifyToken({ token, secretKey: process.env.SECRETKEYRESETPASS});
  } else if (key === process.env.TOKEN_PRIFEX2) {
    result = await verifyToken({ token, secretKey: process.env.SECRET_KEY });
  }
  //check user
  if (result.errorMessage) return next(new AppError(result.errorMessage));

  const dbToken = await Token.findOne({ token, userId: result._id, isValid: true });
  if (!dbToken || new Date() > dbToken.expiresAt) {
    return next(new AppError("Token is invalid or has expired", 401));
  }

  let user = await User.findOne({_id: result._id}).select("-password");
  if (!user) {
    return next(new AppError("User not found, please signUp first", 401));
  }
  if (user.status !== status.VERIFIED) {
    return next(new AppError("Your account is not verified or has been blocked", 401));
  }

  req.authUser = user;
  next();
});

export const isAuthorized = (roles = []) => {
  return (req, res, next) => {
    const user = req.authUser;
    if (!roles.includes(user.role)) {
      return next(new AppError(messages.user.notAuthorized, 401));
    }
    next();
  };
};
