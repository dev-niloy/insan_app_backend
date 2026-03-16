import { NextFunction, Request, Response } from "express";
import config from "../../config";
import { Secret } from "jsonwebtoken";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
import { jwtHelpers } from "../../utils/helpers/jwtHelpers";
import prisma from "../../shared/prisma";

// src/types/auth.d.ts
export interface UserFromJwt {
  id: string;
  email: string;
  phone?: string;
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
        },
      });

      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not found!");
      }


      // Attach decoded user and permissions to request
      req.user = {
        ...decodedUser,
      } as UserFromJwt;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default authGuard;
