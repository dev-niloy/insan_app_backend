import { Request } from "express";
import prisma from "../../../shared/prisma";
import { TUserLogin } from "../../types/common";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import * as bcrypt from "bcrypt";
import { jwtHelpers } from "../../../utils/helpers/jwtHelpers";
import {
  generateAdviserSerial,
  generateClientSerial,
} from "../../../utils/helpers/generateSerial";
import { sendOTP } from "../../../utils/helpers/sendOTP";
import { sendSMS } from "../../../utils/helpers/sendSMS";
import { generateResetToken } from "../../../utils/helpers/generateResetToken";
import { addMinutes } from "date-fns";
import { v4 as uuid } from "uuid";
import { promises as fs } from "fs";
import path from "path";
import { generateReferralCode } from "../../../utils/helpers/generateReferralCode";
import {
  ReferralStatus,
  User,
  UserType,
  VerificationStatus,
} from "@prisma/client";
import { generateUserTokens } from "../../../utils/helpers/tokenHelpers";
import { sendEmail } from "../../../utils/email/sendEmail";
import config from "../../../config";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { getClientIp, getGeoInfo } from "../../../utils/mini_utils";
import { createAdminValidation } from "./auth.validation";

// register user
const userRegister = async (req: Request) => {
  const userData = req.body;
  const { phone, email, password, user_type, username, referred_by } = userData;

  // 1️⃣ Get IP
  const ip = getClientIp(req);
  userData.ip_address = ip;

  // 2️⃣ Get country & timezone
  const { country, timezone } = getGeoInfo(ip);
  userData.country = country;
  userData.timezone = timezone;

  // 3️⃣ Optionally set currency based on country
  userData.currency = "USD";

  // Set currency based on country
  userData.currency = "USD";

  // Step 1: Validate referral code, phone, and email
  let referrer_id: string = "";

  if (referred_by) {
    const referrer = await prisma.user.findUnique({
      where: { referral_code: referred_by },
    });

    if (!referrer) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid referral code.");
    }
    referrer_id = referrer.id;
  }

  if (phone) {
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `User with phone ${phone} already exists`,
      );
    }
  }

  if (email) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `User with email ${email} already exists`,
      );
    }
  }

  // Step 2: Prepare hashed password and referral code/link
  const hashedPassword = await bcrypt.hash(password, 12);
  const referralCode = generateReferralCode(uuid());
  const referralLink = `${config.client_url}/register?referralCode=${referralCode}`;
  const { referred_by: _ignored, ...restData } = userData;

  // Step 3: Fetch referral settings if needed
  const referralSettings = referrer_id
    ? await prisma.referral_Settings.findFirst({ where: { isDeleted: false } })
    : null;

  // Step 4: Begin Prisma Transaction
  const { newUser, client_id, adviser_id, verification_status } =
    await prisma.$transaction(async (tx) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          ...restData,
          password: hashedPassword,
          username: `@${username}`,
          referral_code: referralCode,
          referral_link: referralLink,
        },
      });

      // 2. Create Wallet
      await tx.wallet.create({
        data: { userId: newUser.id, walletCurrency: userData.currency },
      });

      // 3. Create Referral Record if applicable
      if (referrer_id && referralSettings?.is_referral_system_on) {
        let referrer_bonus = 0;
        let referee_bonus = 0;

        if (referralSettings.is_referral_bonus_active_for_referrer) {
          if (
            user_type === "client" &&
            referralSettings.is_referrer_referral_bonus_active_for_client
          ) {
            referrer_bonus =
              referralSettings.referrer_client_referral_bonus_amount ?? 0;
          } else if (
            user_type === "adviser" &&
            referralSettings.is_referrer_referral_bonus_active_for_adviser
          ) {
            referrer_bonus =
              referralSettings.referrer_adviser_referral_bonus_amount ?? 0;
          }
        }

        if (referralSettings.is_referral_bonus_active_for_referee) {
          if (
            user_type === "client" &&
            referralSettings.is_referee_referral_bonus_active_for_client
          ) {
            referee_bonus =
              referralSettings.referee_client_referral_bonus_amount ?? 0;
          } else if (
            user_type === "adviser" &&
            referralSettings.is_referee_referral_bonus_active_for_adviser
          ) {
            referee_bonus =
              referralSettings.referee_adviser_referral_bonus_amount ?? 0;
          }
        }

        await tx.referral.create({
          data: {
            referrer_id,
            referred_user_id: newUser.id,
            status: ReferralStatus.PENDING,
            referrer_bonus_amount: referrer_bonus,
            referee_bonus_amount: referee_bonus,
            reward_approved: false,
          },
        });
      }

      // 4. Create role-based record (Client or Adviser)
      let client_id = "";
      let adviser_id = "";
      let verification_status: string =
        VerificationStatus.APPROVED ||
        VerificationStatus.PENDING ||
        VerificationStatus.REJECTED ||
        VerificationStatus.NOT_PROVIDED;

      if (user_type === "client") {
        const clientSerial = await generateClientSerial();
        const client = await tx.client.create({
          data: { user_id: newUser.id, client_serial: clientSerial },
        });
        client_id = client.id;
      } else if (user_type === "adviser") {
        const adviserSerial = await generateAdviserSerial();
        const adviser = await tx.adviser.create({
          data: { users_id: newUser.id, adviser_serial: adviserSerial },
        });
        adviser_id = adviser.id;
        verification_status = adviser.verification_status;
      }

      return { newUser, client_id, adviser_id, verification_status };
    });

  // Step 5: Generate Tokens
  const tokenPayload = {
    id: newUser.id,
    name: newUser.name,
    image: newUser.image,
    cover_image: newUser.cover_image,
    email: newUser.email,
    phone: newUser.phone,
    user_type: newUser.user_type,
    client_id,
    adviser_id,
    verification_status,
    timezone,
    currency: newUser.currency,
  };

  const accessToken = jwtHelpers.generateToken(
    tokenPayload,
    config.jwt.access_secret as string,
    config.jwt.access_expires_in as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    tokenPayload,
    config.jwt.refresh_secret as string,
    config.jwt.refresh_expires_in as string,
  );

  return { accessToken, refreshToken };
};

// OTP verification code send
const otpVerificationSend = async (req: Request) => {
  const { phone, email } = req.body;

  if (phone) {
    // Check if phone number exists and is not deleted
    const userByPhone = await prisma.user.findFirst({
      where: {
        phone,
        isDeleted: false,
      },
    });

    if (!userByPhone) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Phone number not found");
    }

    // Check if phone number is already verified
    if (userByPhone.isNumberVerified) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Phone number already verified",
      );
    }
  } else if (email) {
    // Check if email exists and is not deleted
    const userByEmail = await prisma.user.findFirst({
      where: {
        email,
        isDeleted: false,
      },
    });

    if (!userByEmail) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email not found");
    }

    // Check if email is already verified
    if (userByEmail.isEmailVerified) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already verified");
    }
  }

  // Send OTP to the provided phone or email
  if (phone) {
    const result = await sendOTP({ phone });

    // Define the path to the file in the root directory
    const filePath = path.resolve(process.cwd(), "otp_response.txt");

    // Initialize the response number
    let responseNumber = 1;
    let fileContent = "";

    try {
      // Read existing file content if the file exists
      fileContent = await fs.readFile(filePath, "utf-8");

      // Count existing responses to determine the next response number
      const matches = fileContent.match(/res \d+/g);
      if (matches) {
        responseNumber = matches.length + 1;
      }
    } catch (error: any) {
      throw new ApiError(httpStatus.BAD_REQUEST, error);
    }

    // Append the new response with the response number
    const newEntry = `res ${responseNumber}: ${result}\n`;
    // Write the updated content back to the file
    await fs.writeFile(filePath, fileContent + newEntry, "utf-8");

    const regex = /SMS Sent Successfully To/;

    if (regex.test(result)) {
      return { message: `OTP sent successfully to - ${phone}` };
    } else {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send OTP",
      );
    }
  } else if (email) {
    sendOTP({ email });
  }

  return null; // Optional return value
};

// OTP verification
const otpVerification = async (req: Request) => {
  const { phone, email, otp } = req.body;

  let otpRecord;

  // Determine if OTP verification is for phone or email
  if (phone) {
    otpRecord = await prisma.otp.findFirst({
      where: {
        phone: phone,
      },
    });
  } else if (email) {
    otpRecord = await prisma.otp.findFirst({
      where: {
        email: email,
      },
    });
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Phone or email must be provided",
    );
  }

  // Check if OTP record exists
  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid phone number or email");
  }

  // Check if OTP has expired
  if (otpRecord.expiryTime < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP has expired");
  }

  // Check if OTP matches
  if (otpRecord.otp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  // Update user's verification status based on phone or email
  if (phone) {
    await prisma.user.update({
      where: { phone: phone },
      data: { isNumberVerified: true },
    });
  } else if (email) {
    await prisma.user.update({
      where: { email: email },
      data: { isEmailVerified: true },
    });
  }

  // Delete the verified OTP record from database (optional)
  await prisma.otp.delete({
    where: {
      id: otpRecord.id,
    },
  });

  return null;
};

// login user
const loginUser = async (payload: TUserLogin) => {
  let user;

  // Check if either phone or email is provided in the payload
  if (!payload.phone && !payload.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Phone or email is required");
  }

  if (payload.phone) {
    user = await prisma.user.findFirst({
      where: {
        phone: payload.phone,
        isDeleted: false,
      },
      include: {
        client: true,
        adviser: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
    }
  } else if (payload.email) {
    user = await prisma.user.findFirst({
      where: {
        email: payload.email,
        isDeleted: false,
      },
      include: {
        client: true,
        adviser: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
    }
  }

  // Verify password
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    user!.password as string,
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect password");
  }

  let userData;

  // Find user by phone if provided
  if (payload.phone) {
    userData = await prisma.user.findFirst({
      where: {
        phone: payload.phone,
        isDeleted: false,
        isNumberVerified: true,
      },
      include: {
        client: true,
        adviser: true,
      },
    });
  }

  // Find user by email if provided
  if (!userData && payload.email) {
    userData = await prisma.user.findFirst({
      where: {
        email: payload.email,
        isDeleted: false,
        isEmailVerified: true,
      },
      include: {
        client: true,
        adviser: true,
      },
    });
  }

  if (!userData) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User not found or email or phone not verified yet !",
    );
  }

  if (userData.isBanned) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Your account is banned. Reason: ${userData.banReason || "No reason provided. Contact support."}`,
    );
  }

  const { accessToken, refreshToken } = await generateUserTokens(userData.id);

  return {
    accessToken,
    refreshToken,
  };
};

// refresh token
const refreshToken = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_secret as string,
    );
  } catch (err) {
    throw new Error("You are not authorized!");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData.email,
      isDeleted: false,
    },
    include: {
      client: true,
      adviser: true,
    },
  });

  const { accessToken, refreshToken } = await generateUserTokens(userData.id);
  return {
    accessToken,
  };
};

// forgot password otp send
const forgotPasswordOtpSend = async (payload: {
  email?: string;
  phone?: string;
}) => {
  if (!payload.email && !payload.phone) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Either email or phone number must be provided",
    );
  }

  let user;

  if (payload.phone) {
    user = await prisma.user.findFirst({
      where: {
        phone: payload.phone,
        isDeleted: false,
        isNumberVerified: true,
      },
    });
  } else if (payload.email) {
    user = await prisma.user.findFirst({
      where: {
        email: payload.email,
        isDeleted: false,
        isEmailVerified: true,
      },
    });
  }

  if (!user) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User not found or email or phone not verified yet !",
    );
  }

  // Generate a reset token
  const token = generateResetToken();
  const resetToken = `${token}&email=${payload.phone ? payload.phone : payload.email}`;

  // Calculate the expiry time (e.g., 10 minutes from now)
  const expiryTime = addMinutes(new Date(), 10);

  // Check if there's an existing OTP or reset token for this user
  let existingOtp;
  if (payload.phone) {
    existingOtp = await prisma.otp.findFirst({
      where: { phone: payload.phone },
    });
  } else if (payload.email) {
    existingOtp = await prisma.otp.findFirst({
      where: { email: payload.email },
    });
  }

  // If an existing OTP or reset token exists, delete it
  if (existingOtp) {
    await prisma.otp.delete({
      where: { id: existingOtp.id },
    });
  }

  // Create a new OTP record
  const result = await prisma.otp.create({
    data: {
      phone: payload.phone || null,
      email: payload.email || null,
      otp: token,
      expiryTime: expiryTime,
    },
  });

  // Generate reset link
  const resetLink = `${config.client_url}/reset-password?token=${resetToken}`;

  // Send the reset link via email or SMS
  if (payload.phone) {
    await sendSMS(payload.phone, resetLink, "forgot_password");
  } else if (payload.email) {
    await sendEmail(payload.email, resetLink, "forgot_password");
  }
};

// forgot password
const forgotPassword = async (payload: {
  email?: string;
  phone?: string;
  newPassword: string;
  otp: string;
}) => {
  if (!payload.email && !payload.phone) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Email or phone number must be provided",
    );
  }

  const otpRecord = await prisma.otp.findFirst({
    where: {
      OR: [{ email: payload.email }, { phone: payload.phone }],
      otp: payload.otp,
    },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  if (new Date() > otpRecord.expiryTime) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP has expired");
  }

  const userCriteria = payload.email
    ? { email: payload.email }
    : { phone: payload.phone };

  const user = await prisma.user.findFirst({
    where: userCriteria,
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

  // updating password
  await prisma.user.update({
    where: userCriteria,
    data: {
      password: hashedPassword,
    },
  });

  // Delete the OTP record if API call is successful
  await prisma.otp.delete({
    where: { id: otpRecord.id },
  });

  return null;
};

// reset password
const resetPassword = async (payload: {
  email: string;
  currentPassword?: string;
  newPassword: string;
  type: "regular" | "social";
}) => {
  let user;

  // Step 1: checking if the user exists
  user = await prisma.user.findFirst({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  if (payload.type === "regular") {
    if (!payload.currentPassword) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Current password is required for regular users",
      );
    }

    // Step 2: Verify current password
    const isCurrentPasswordCorrect: boolean = await bcrypt.compare(
      payload.currentPassword,
      user.password as string,
    );

    if (!isCurrentPasswordCorrect) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect password");
    }
  }

  // Step 3: Hash the new password
  const hashedPassword: string = await bcrypt.hash(payload.newPassword, 12);

  // Step 4: Update password in the database
  await prisma.user.update({
    where: {
      email: payload.email,
    },
    data: {
      password: hashedPassword,
      isPasswordSet: true,
    },
  });

  return null;
};

// validate session token - accessToken
const validateSessionAccessToken = async (accessTokenPayload: string) => {
  let decoded: any;

  // Decode without verifying expiration
  decoded = jwt.verify(accessTokenPayload, config.jwt.access_secret as string, {
    ignoreExpiration: true,
  });

  const userId = decoded.id;

  // Check refresh token in DB
  const refreshTokenEntry = await prisma.refreshToken.findFirst({
    where: {
      userId,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" }, // latest one
  });

  if (!refreshTokenEntry) {
    throw new Error("Session expired. Please log in again.");
  }

  // Generate new access token

  const { accessToken } = await generateUserTokens(userId);

  return {
    accessToken,
  };
};

const registerUserWithAdminPennel = async (req: Request) => {
  const userData = req.body;
  const { phone, email, password, user_type } = userData;

  const ip = getClientIp(req);
  userData.ip_address = ip;

  const { country, timezone } = getGeoInfo(ip);
  userData.country = country;
  userData.timezone = timezone;

  userData.currency = "USD";

  if (phone) {
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `User with phone ${phone} already exists`,
      );
    }
  }

  if (email) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `User with email ${email} already exists`,
      );
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const referralCode = generateReferralCode(uuid());
  const referralLink = `${config.client_url}/register?referralCode=${referralCode}`;

  const { newUser, client_id, adviser_id } = await prisma.$transaction(
    async (tx) => {
      const newUser = await tx.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          referral_code: referralCode,
          referral_link: referralLink,
          isNumberVerified: true,
          isEmailVerified: true,
        },
      });

      await tx.wallet.create({
        data: {
          userId: newUser.id,
          walletCurrency: userData.currency,
        },
      });

      let client_id = "";
      let adviser_id = "";

      if (user_type === "client") {
        const clientSerial = await generateClientSerial();
        const client = await tx.client.create({
          data: { user_id: newUser.id, client_serial: clientSerial },
        });
        client_id = client.id;
      } else if (user_type === "adviser") {
        const adviserSerial = await generateAdviserSerial();
        const adviser = await tx.adviser.create({
          data: { users_id: newUser.id, adviser_serial: adviserSerial },
        });
        adviser_id = adviser.id;
      }

      return { newUser, client_id, adviser_id };
    },
  );

  return {
    success: true,
    message: "User registered successfully via admin panel.",
    data: {
      id: newUser.id,
      email: newUser.email,
      phone: newUser.phone,
      user_type: newUser.user_type,
      client_id,
      adviser_id,
      isEmailVerified: true,
      isNumberVerified: true,
    },
  };
};

const removeUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User Not Found");
  }

  await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      isDeleted: true,
    },
  });
};

const ChangePassword = async (
  payload: { old_password: string; new_password: string },
  userId: string,
) => {
  const isUserValid = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!isUserValid) {
    throw new ApiError(httpStatus.NOT_FOUND, "No user found");
  }

  if (!isUserValid.password) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Password not set for this account",
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.old_password,
    isUserValid.password,
  );

  if (!isPasswordMatched) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid password");
  }

  const hashedPassword = await bcrypt.hash(
    payload.new_password,
    Number(config.bcrypt_salt_rounds),
  );

  const reuslt = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return reuslt;
};

const createAdmin = async (payload: Partial<User>) => {
  const isAdmin = await prisma.user.findFirst({
    where: {
      id: payload.id,
      user_type: UserType.admin,
    },
  });

  if (!isAdmin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Its Not Valid Admin");
  }

  const isUsernameExist = await prisma.user.findUnique({
    where: {
      username: payload.username!,
    },
  });

  if (isUsernameExist) {
    throw new ApiError(httpStatus.CONFLICT, "This username already exists");
  }

  const hashPassword = await bcrypt.hash(payload.password!, 10);

  const result = await prisma.user.create({
    data: {
      username: payload.username,
      name: payload.name!,
      email: payload.email,
      password: hashPassword,
      user_type: UserType.admin,
      referral_code: crypto.randomUUID(),
      verified: true,
      isEmailVerified: true,
      gender: payload.gender,
    },
  });
  console.log(result);
  return result;
};
export const AuthServices = {
  otpVerificationSend,
  loginUser,
  refreshToken,
  userRegister,
  otpVerification,
  forgotPasswordOtpSend,
  forgotPassword,
  resetPassword,
  validateSessionAccessToken,
  registerUserWithAdminPennel,
  removeUser,
  ChangePassword,
  createAdmin,
};
