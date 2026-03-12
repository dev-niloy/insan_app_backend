import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { AuthServices } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { SocialLoginSignUpServices } from "./social-auth.service";
import ApiError from "../../errors/ApiError";
import { saveRefreshTokenInDatabase } from "../../../utils/saveRefreshTokenInDatabase";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../../utils/helpers/jwtHelpers";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { generateUserTokens } from "../../../utils/helpers/tokenHelpers";

// user register
const userRegister = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.userRegister(req);

  const { accessToken, refreshToken } = result;

  saveRefreshTokenInDatabase(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New user in successfully created!",
    data: {
      accessToken,
    },
  });
});

// OTP send
const otpVerificationSend = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.otpVerificationSend(req);

  let OTPSendSource: string = "";

  if (req.body.phone) {
    OTPSendSource = `OTP code has been sent to phone ${req.body.phone} successfully!`;
  } else if (req.body.email) {
    OTPSendSource = `OTP code has been sent to email ${req.body.email} successfully!`;
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: OTPSendSource,
    data: result,
  });
});

// OTP verification
const otpVerification = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.otpVerification(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verification successful !",
    data: result,
  });
});

// user login
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);
  const { accessToken, refreshToken } = result;

  saveRefreshTokenInDatabase(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully!",
    data: {
      accessToken,
    },
  });
});

// refresh token
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  const result = await AuthServices.refreshToken(refreshToken);
  const { accessToken } = result;

  saveRefreshTokenInDatabase(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token generated successfully!",
    data: {
      accessToken,
    },
  });
});

// forgot Password otp send
const forgotPasswordOtpSend = catchAsync(
  async (req: Request, res: Response) => {
    const { email, phone } = req.body;

    await AuthServices.forgotPasswordOtpSend({ email, phone });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Please check your given media for OTP code!",
      data: null,
    });
  },
);

// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, phone, newPassword, otp } = req.body;

  const combineData = { email, phone, newPassword, otp };
  await AuthServices.forgotPassword(combineData);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully!",
    data: null,
  });
});

// reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body, "reset password");
  const { currentPassword, newPassword, type } = req.body;

  const email = req.params.email;
  const combineData =
    type === "regular"
      ? { email, currentPassword, newPassword, type }
      : { email, newPassword, type };

  await AuthServices.resetPassword(combineData);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully!",
    data: null,
  });
});

// user social login sign-up
const handleSocialLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await SocialLoginSignUpServices.handleSocialLogin(
    req.body,
    req,
  );
  const { accessToken, refreshToken } = result;

  saveRefreshTokenInDatabase(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully!",
    data: {
      accessToken,
    },
  });
});

// validate session token - accessToken
const validateSessionAccessToken = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    jwtHelpers.verifyToken(
      refreshToken?.token as string,
      config.jwt.refresh_secret as string,
    );

    const user = await prisma.user.findUnique({
      where: {
        id: refreshToken?.userId,
        isDeleted: false,
      },
      select: {
        id: true,
        user_type: true,
        client: {
          select: {
            id: true,
          },
        },
        adviser: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "user not found");
    }
    const { accessToken } = await generateUserTokens(user.id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Token validated successfully",
      data: {
        accessToken: accessToken,
      },
    });
  },
);

const registerUserWithAdminPennel = catchAsync(async (req, res) => {
  const result = await AuthServices.registerUserWithAdminPennel(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New user in successfully created!",
    data: result,
  });
});
const removeUser = catchAsync(async (req, res) => {
  const result = await AuthServices.removeUser(req.params?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "successfully remove user",
    data: result,
  });
});
const temporaryGetRequest = catchAsync(async (req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "successfully user Fetched users",
    data: "",
  });
});

const ChangePassword = catchAsync(async (req, res) => {
  const { old_password, new_password } = req.body;
  const userId = req.user?.id as string;
  const result = AuthServices.ChangePassword(req.body, userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: "Password Change successfully",
  });
});

const cerateAdmin = catchAsync(async (req, res) => {
  const result = await AuthServices.createAdmin(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "new Admin create Successfully",
    data: result,
  });
});

export const AuthController = {
  loginUser,
  refreshToken,
  userRegister,
  otpVerification,
  otpVerificationSend,
  forgotPasswordOtpSend,
  forgotPassword,
  resetPassword,
  handleSocialLogin,
  validateSessionAccessToken,
  registerUserWithAdminPennel,
  removeUser,
  temporaryGetRequest,
  ChangePassword,
  cerateAdmin,
};
