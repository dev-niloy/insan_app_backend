import { Gender } from "@prisma/client";
import { z } from "zod";
import { UserType } from "@prisma/client";

// Register validation schema
const bangladeshiPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;

const UserRegisterZodValidation = z.object({
  body: z
    .object({
      name: z.string(),
      phone: z
        .string()
        .regex(bangladeshiPhoneRegex, "Invalid Bangladeshi phone number")
        .optional(),
      email: z.string().email().optional(),
      gender: z.enum([Gender.Male, Gender.Female, Gender.Other]).optional(),
      image: z.string().optional(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long"),
      ip_address: z.string().optional(),
      user_type: z.enum(["client", "adviser"]),
    })
    .refine((data) => data.phone || data.email, {
      message: "Either email or phone is required",
      path: ["phone", "email"],
    }),
});

// send otp validation schema
const OTPSendValidationSchema = z.object({
  body: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
});

// otp validation schema
const OTPValidationSchema = z.object({
  body: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    otp: z.string(),
  }),
});

// Login validation schema
const UserLoginZodValidation = z.object({
  body: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string(),
  }),
});
export const createAdminValidation = z.object({
  body: z.object({
    id: z.string(),
    username: z.string(),
    name: z.string(), // normal string
    email: z.string().email(), // email validation here
    password: z.string(),
    gender: z.string(),
  }),
});

// Social login validation schema
const SocialLoginValidationSchema = z.object({
  body: z
    .object({
      provider: z.enum(["google", "linkedin", "facebook"], {
        errorMap: () => ({
          message: "Provider must be one of: google, linkedin, facebook",
        }),
      }),
      user_type: z
        .enum(["client", "adviser"], {
          errorMap: () => ({
            message: "User role must be one of: client, adviser",
          }),
        })
        .optional()
        .nullable(),
      page: z
        .enum(["login", "register"], {
          errorMap: () => ({
            message: "Page must be one of: login, register",
          }),
        })
        .optional(),

      // Username is optional for login, required for register (validated in service)
      username: z.string().optional(),

      // Support both access token and authorization code flows
      token: z
        .string()
        .min(1, "Token is required and cannot be empty")
        .optional(),
      code: z
        .string()
        .min(1, "Authorization code is required and cannot be empty")
        .optional(),
      redirect_uri: z.string().optional(),
    })

    .refine((data) => data.token || data.code, {
      message:
        "Either 'token' (for access token flow) or 'code' (for authorization code flow) is required",
      path: ["token"],
    }),
});

const loginUserValidation = z.object({
  body: z.object({
    phone: z
      .string()
      .min(11, "Phone number must be at least 11 digits")
      .max(20, "Phone number too long")
      .optional(),
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .optional(),

    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
  }),
});

export const CreateUserValidation = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .min(2, "Name must be at least 2 characters"),

    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .optional(),

    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),

    gender: z.enum(["Male", "Female", "Other"], {
      required_error: "Gender is required",
    }),

    timezone: z
      .string({ required_error: "Timezone is required" })
      .min(3, "Invalid timezone")
      .optional(),

    user_type: z.nativeEnum(UserType, {
      required_error: "User type is required",
    }),

    phone: z
      .string()
      .min(11, "Phone number must be at least 11 digits")
      .max(20, "Phone number too long")
      .optional(),
  }),
});
export const forgotPasswordValidation = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .optional(),

    phone: z.string().optional(),
  }),
});

export const ResetPasswordValidation = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .optional(),

    phone: z
      .string({ required_error: "Phone is required" })
      .min(10, "Phone number must be at least 10 digits")
      .max(20, "Phone number too long")
      .optional(),

    newPassword: z.string({ required_error: "New password is required" }),

    otp: z.string({ required_error: "OTP is required" }),
  }),
});

export const UpdatePasswordSchema = z.object({
  body: z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email format"),

      phone: z.string({ required_error: "Phone is required" }),

      type: z.enum(["regular", "social"], {
        required_error: "Type is required",
      }),

      currentPassword: z.string().optional(),

      newPassword: z
        .string({ required_error: "New password is required" })
        .min(6, "New password must be at least 6 characters"),

      confirmPassword: z
        .string({ required_error: "Confirm password is required" })
        .min(6, "Confirm password must be at least 6 characters"),
    })

    // 1️⃣ Require currentPassword only for regular users
    .refine(
      (data) =>
        data.type === "social" ||
        (data.type === "regular" && data.currentPassword),
      {
        message: "currentPassword is required for regular users",
        path: ["currentPassword"],
      },
    )

    // 2️⃣ newPassword and confirmPassword must match
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});
export const UserValidation = {
  OTPSendValidationSchema,
  UserRegisterZodValidation,
  UserLoginZodValidation,
  OTPValidationSchema,
  SocialLoginValidationSchema,
  CreateUserValidation,
  loginUserValidation,
  forgotPasswordValidation,
  ResetPasswordValidation,
  UpdatePasswordSchema,
};
