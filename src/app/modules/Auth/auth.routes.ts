import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./auth.validation";

const router = Router();

// Register user
router.post(
  "/register-user",
  validateRequest(UserValidation.UserRegisterZodValidation)
);
// Login user
router.post(
  "/login",
  validateRequest(UserValidation.UserLoginZodValidation)
);

// Refresh token
router.post("/refresh-token",);

export const authRoutes = router;
