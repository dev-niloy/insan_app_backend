import { Request, Response, Router } from "express";
import { AuthController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createAdminValidation, UserValidation } from "./auth.validation";
import authGuard from "../../middlewares/auth";
import { Permissions } from "../../../constants/permission";
import prisma from "../../../shared/prisma";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { publicApiAuthGuard } from "../../middlewares/publicApiAuthGuard";

const router = Router();

// Register user
router.post(
  "/register-user",
  validateRequest(UserValidation.UserRegisterZodValidation),
  AuthController.userRegister,
);
// Register user
router.post(
  "/register-user-dashboard",
  authGuard(Permissions.admin.create_register_with_adminPennel),
  validateRequest(UserValidation.CreateUserValidation),
  AuthController.registerUserWithAdminPennel,
);

// send OTP
router.post(
  "/send-otp",
  validateRequest(UserValidation.OTPSendValidationSchema),
  AuthController.otpVerificationSend,
);

// verify OTP
router.post(
  "/verify-otp",
  validateRequest(UserValidation.OTPValidationSchema),
  AuthController.otpVerification,
);

// Login user
router.post(
  "/login",
  validateRequest(UserValidation.loginUserValidation),
  AuthController.loginUser,
);

// Refresh token
router.post("/refresh-token", AuthController.refreshToken);

// forgot password otp send to media
router.post(
  "/forgot-password_otp-send",
  validateRequest(UserValidation.forgotPasswordValidation),
  AuthController.forgotPasswordOtpSend,
);

// forgot password
router.post(
  "/forgot-password",
  validateRequest(UserValidation.ResetPasswordValidation),
  AuthController.forgotPassword,
);

// reset password
router.post(
  "/reset-password/:email",
  // validateRequest(UserValidation.UpdatePasswordSchema), eita ektu problem ache
  AuthController.resetPassword,
);

// social login signup
router.post(
  "/social-login",
  validateRequest(UserValidation.SocialLoginValidationSchema),
  AuthController.handleSocialLogin,
);

// fcm registration
router.post(
  "/fcm-register",
  authGuard(Permissions.register_fcm),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { token, device } = req.body;

    if (!token) {
      throw new ApiError(httpStatus.BAD_REQUEST, "FCM token is required.");
    }

    const existing = await prisma.fcmToken.findUnique({ where: { token } });

    if (existing) {
      await prisma.fcmToken.update({
        where: { token },
        data: { userId, device },
      });
    } else {
      await prisma.fcmToken.create({
        data: { token, userId, device },
      });
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "FCM token registered successfully.",
      data: null,
    });
  }),
);

// fcm unregister
router.post(
  "/fcm-unregister",
  authGuard(Permissions.register_fcm),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    await prisma.fcmToken.deleteMany({ where: { userId } });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "FCM tokens removed successfully.",
      data: null,
    });
  }),
);

// validate session token - accessToken
router.post(
  "/validate-access-token/:userId",
  AuthController.validateSessionAccessToken,
);

router.post(
  "/create-admin",
  validateRequest(createAdminValidation),
  AuthController.cerateAdmin,
);

//temporary
router.delete("/remove/:id", AuthController.removeUser);
router.get("/", AuthController.temporaryGetRequest);
router.post(
  "/chnange-password",
  authGuard(Permissions.get_me),
  AuthController.ChangePassword,
);

export const authRoutes = router;
