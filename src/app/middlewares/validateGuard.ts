import { NextFunction, Request, Response } from "express";
import config from "../../config";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";


export interface UserFromJwt {
  id: string;
  email: string;
  phone?: string;
  token?: string;
}

const validateGuard = () => {
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

      const decodedUser = jwt.verify(
        token,
        config.jwt.access_secret as string,
        {
          ignoreExpiration: true,
        },
      ) as jwt.JwtPayload;
      // Attach decoded user and permissions to request
      req.user = {
        ...decodedUser,
        token,
      } as UserFromJwt;

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default validateGuard;
