import { PrismaClient } from "@prisma/client";
import { jwtHelpers } from "./jwtHelpers";
import config from "../../config";
import httpStatus from "http-status";
import ApiError from "../../app/errors/ApiError";

const prisma = new PrismaClient();

export const generateUserTokens = async (userId: string) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: userId,
      isDeleted: false,
    },
    include: {
      adviser: {
        select: {
          id: true,
          verification_status: true,
        },
      },
      client: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const payload = {
    id: userData.id,
    name: userData?.name,
    email: userData?.email,
    image: userData?.image,
    cover_image: userData?.cover_image,
    role: userData?.user_type,
  };

  const accessToken = jwtHelpers.generateToken(
    payload,
    config.jwt.access_secret as string,
    config.jwt.access_expires_in as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    payload,
    config.jwt.refresh_secret as string,
    config.jwt.refresh_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
  };
};
