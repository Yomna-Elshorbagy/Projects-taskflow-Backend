import { Router } from "express";
import * as authControllers from "./auth.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { isAuthenticated } from "../../middelwares/auth.js";
import { signUpVal, logInVal } from "./auth.validation.js";

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

export default authRouter;
