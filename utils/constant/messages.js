const generateMessage = (entity) => ({
  alreadyExist: `${entity} already exist`,
  notFound: `${entity} not found`,
  notAllowed: `You are not allowed to ${entity}`,
  notAuthorized: `You are not authorized`,
  notValid: `${entity} is not valid`,
  notMatch: `${entity} do not match`,
  notCorrect: `${entity} is not correct`,
  notUnique: `${entity} must be unique`,
  failToCreate: `fail to create ${entity}`,
  failToUpdate: `fail to update ${entity}`,
  failToDelete: `fail to delete ${entity}`,
  createdSuccessfully: `${entity} created Successfully`,
  updatedSuccessfully: `${entity} updated Successfully`,
  deletedSuccessfully: `${entity} deleted Successfully`,
  fetchedSuccessfully: `${entity} fetched Successfully`,
  clearedSuccessfully:`${entity} Cleared Successfully`
});

export const messages = {
  user: {
    ...generateMessage("user"),
    verifiedSuccessfully: "account verified Successfully",
    invalidCredential: "invalid credential",
    loggedInSuccessfully: "logIn Successfully",
    notVerified: "email Not Verified",
    hasOTP: "you already has OTP",
    expireOTP: "OTP expired",
    invalidOTP: "Invalid OTP",
    loggedOutSuccessfully: "logged Out Successfully",
  },
  password: generateMessage("password"),
  file: { required: "file is required" },
  project: generateMessage("project"),
  task: generateMessage("task"),
};
