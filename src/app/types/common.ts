import { Gender } from "@prisma/client";

export type TUserAuthProps = {
  name: string;
  phone: string;
  email: string;
  gender: Gender;
  image: string;
  password: string;
  ip_address: string;
  user_type: "client" | "adviser";
  referred_by: string;
};

export type TUserLogin = {
  phone?: string;
  email?: string;
  password: string;
};
