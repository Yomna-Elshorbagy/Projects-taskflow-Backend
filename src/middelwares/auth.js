import User from "../../database/models/user.model.js";
import { verifyToken } from "../../utils/token.js";
import { status } from "../../utils/constant/enums.js";
import { messages } from "../../utils/constant/messages.js";
import Token from "../../database/models/token.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";

/**
 * Shared helper to verify authorization tokens and return the verified user.
 * Can be reused by both Express routes and WebSockets.
 * 
 * @param {string} authentication - The authentication header value (e.g. "Bearer token...")
 * @returns {Promise<User>} The verified User document.
 * @throws {AppError} if token/user validation fails.
 */
export const verifyAndGetUser = async (authentication) => {
  if (!authentication) {
    throw new AppError(messages.user.signInRequired, 401);
  }

  let [key, token] = authentication.split(" ");
  const validPrefixes = [
    process.env.TOKEN_PRIFEX1,
    process.env.TOKEN_PRIFEX2,
  ];
  if (!validPrefixes.includes(key)) {
    throw new AppError("Invalid token prefix", 401);
  }

  let result = "";
  if (key === process.env.TOKEN_PRIFEX1) {
    result = await verifyToken({ token, secretKey: process.env.SECRETKEYRESETPASS });
  } else if (key === process.env.TOKEN_PRIFEX2) {
    result = await verifyToken({ token, secretKey: process.env.SECRET_KEY });
  }

  if (result.errorMessage) {
    throw new AppError(result.errorMessage, 401);
  }

  const dbToken = await Token.findOne({ token, userId: result._id, isValid: true });
  if (!dbToken || new Date() > dbToken.expiresAt) {
    throw new AppError("Token is invalid or has expired", 401);
  }

  let user = await User.findOne({ _id: result._id }).select("-password");
  if (!user) {
    throw new AppError("User not found, please signUp first", 401);
  }
  if (user.status !== status.VERIFIED) {
    throw new AppError("Your account is not verified or has been blocked", 401);
  }

  return user;
};

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  try {
    const { authentication } = req.headers;
    const user = await verifyAndGetUser(authentication);
    req.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
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
