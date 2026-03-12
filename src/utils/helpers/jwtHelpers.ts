/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

const generateToken = (payload: any, secret: Secret, expiresIn: string) => {
  const options: SignOptions = {
    algorithm: "HS256",
    // Cast expiresIn to the expected type
    expiresIn: expiresIn as unknown as SignOptions["expiresIn"],
  };

  const token = jwt.sign(payload, secret, options);

  return token;
};

const verifyToken = (token: string, secret: Secret) => {
  const res = jwt.verify(token, secret) as JwtPayload;
  return res;
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
