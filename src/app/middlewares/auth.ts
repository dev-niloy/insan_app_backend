import { NextFunction, Request, Response } from "express";
import config from "../../config";
import { Secret } from "jsonwebtoken";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
import { jwtHelpers } from "../../utils/helpers/jwtHelpers";
import prisma from "../../shared/prisma";

// src/types/auth.d.ts
import { Adviser, Client } from "@prisma/client";

export interface UserFromJwt {
  id: string;
  email: string;
  phone?: string;
  role: "client" | "adviser" | "admin";
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  verificationStatus: "APPROVED" | "PENDING" | "REJECTED" | "NOT_PROVIDED";
  client?: Client | null;
  adviser?: Adviser | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[]; // added in authGuard
  token?: string;
}

const authGuard = (...requiredPermissions: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      let decodedUser;
      try {
        decodedUser = jwtHelpers.verifyToken(
          token,
          config.jwt.access_secret as Secret,
        );
      } catch (err: any) {
        if (err.name === "TokenExpiredError") {
          throw new ApiError(httpStatus.UNAUTHORIZED, "jwt expired");
        }
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
      }

      // Fetch user basic info
      const user = await prisma.user.findUnique({
        where: {
          id: decodedUser.id,
          isDeleted: false,
        },
        select: {
          id: true,
          email: true,
          user_type: true,
        },
      });

      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not found!");
      }

      // Fetch permissions based on user_type → Role.title
      const roleWithPermissions = await prisma.role.findFirst({
        where: {
          title: user.user_type,
          isDeleted: false,
        },
        select: {
          permissions: {
            select: {
              permission: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      const userPermissions =
        roleWithPermissions?.permissions?.map((p) => p.permission.title) || [];

      // Attach decoded user and permissions to request
      req.user = {
        ...decodedUser,
        permissions: userPermissions,
      } as UserFromJwt;

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every((perm) =>
        userPermissions.includes(perm),
      );

      if (!hasAllPermissions) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have the required permissions!",
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default authGuard;
