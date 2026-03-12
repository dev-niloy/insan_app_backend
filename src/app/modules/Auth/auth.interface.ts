export interface SocialUserData {
  email: string;
  name?: string;
  picture?: string;
  provider: "google" | "linkedin" | "facebook";
  emailVerified: boolean;
}

export interface SocialLoginPayload {
  provider: "google" | "linkedin" | "facebook";
  token?: string;
  code?: string;
  redirect_uri?: string;
  page?: "login" | "register";
  username?: string;
  user_type?: "client" | "adviser";
}
