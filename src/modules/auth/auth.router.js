import { Router } from "express";
import * as authControllers from "./auth.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { isAuthenticated } from "../../middelwares/auth.js";
import { signUpVal, logInVal, updateProfileVal } from "./auth.validation.js";

const authRouter = Router();

authRouter.post(
  "/signup",
  validate(signUpVal),
  authControllers.signup
);

authRouter.post(
  "/login",
  validate(logInVal),
  authControllers.logIn
);

authRouter.post("/logout", isAuthenticated, authControllers.logout);

authRouter.get("/users", isAuthenticated, authControllers.getAllUsers);

authRouter.get("/profile", isAuthenticated, authControllers.getProfile);
authRouter.put(
  "/profile",
  isAuthenticated,
  validate(updateProfileVal),
  authControllers.updateProfile
);

export default authRouter;
