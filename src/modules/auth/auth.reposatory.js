import User from "../../../database/models/user.model.js";
import Token from "../../../database/models/token.model.js";

export const findUserByEmailOrMobile = async (email, mobileNumber, extraQuery = {}) => {
  return await User.findOne({
    $or: [{ email }, { mobileNumber }],
    ...extraQuery
  });
};

export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

export const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

export const updateUserByEmail = async (email, updateData) => {
  return await User.findOneAndUpdate({ email }, updateData, { new: true });
};

export const updateUserById = async (id, updateData) => {
  return await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
};

export const createToken = async (tokenData) => {
  return await Token.create(tokenData);
};

export const invalidateToken = async (token, userId) => {
  return await Token.findOneAndUpdate(
    { token, userId },
    { isValid: false },
    { new: true }
  );
};

export const findAllUsers = async (excludeId) => {
  return await User.find({ _id: { $ne: excludeId } }).select("userName email role");
};
