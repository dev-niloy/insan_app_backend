// social-auth.service.ts
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import config from "../../../config";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { generateReferralCode } from "../../../utils/helpers/generateReferralCode";
import { v4 as uuid } from "uuid";
import prisma from "../../../shared/prisma";
import {
  generateAdviserSerial,
  generateClientSerial,
} from "../../../utils/helpers/generateSerial";
import { SocialLoginPayload, SocialUserData } from "./auth.interface";
import geoip from "geoip-lite";
import { Request } from "express";
import { generateUserTokens } from "../../../utils/helpers/tokenHelpers";
import { getClientIp, getGeoInfo } from "../../../utils/mini_utils";
import { UserType } from "@prisma/client";

// Initialize OAuth clients
const googleClient = new OAuth2Client(
  config.google_credentials.googleClientWeb,
);

// Exchange authorization code for access token
const exchangeCodeForToken = async (
  provider: string,
  code: string,
  redirectUri?: string,
): Promise<string> => {
  switch (provider) {
    case "linkedin":
      return exchangeLinkedInCodeForToken(code, redirectUri);
    case "google":
      // Google typically uses ID tokens, but we can handle auth code flow if needed
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Google authorization code flow not implemented. Use ID token instead.",
      );
    case "facebook":
      return exchangeFacebookCodeForToken(code, redirectUri);
    default:
      throw new Error(
        `Authorization code exchange not supported for provider: ${provider}`,
      );
  }
};

// LinkedIn authorization code exchange
const exchangeLinkedInCodeForToken = async (
  code: string,
  redirectUri?: string,
): Promise<string> => {
  try {
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: config.linkedin_credentials?.linkedin_client_id,
          client_secret:
            config.linkedin_credentials?.linkedin_primary_client_secret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    if (!tokenResponse.data.access_token) {
      throw new Error("No access token received from LinkedIn");
    }

    return tokenResponse.data.access_token;
  } catch (error: any) {
    console.error(
      "LinkedIn code exchange error:",
      error.response?.data || error.message,
    );
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to exchange LinkedIn authorization code: ${error.response?.data?.error_description || error.message}`,
    );
  }
};

// Facebook authorization code exchange
const exchangeFacebookCodeForToken = async (
  code: string,
  redirectUri?: string,
): Promise<string> => {
  // TODO: Add Facebook credentials to config
  throw new ApiError(
    httpStatus.NOT_IMPLEMENTED,
    "Facebook authorization code flow not yet configured. Please add Facebook credentials to config.",
  );

  /* Uncomment when Facebook credentials are added to config
  try {
    const tokenResponse = await axios.get('https://graph.facebook.com/v12.0/oauth/access_token', {
      params: {
        client_id: config.facebook_credentials?.appId,
        client_secret: config.facebook_credentials?.appSecret,
        redirect_uri: redirectUri,
        code,
      }
    });

    if (!tokenResponse.data.access_token) {
      throw new Error('No access token received from Facebook');
    }

    return tokenResponse.data.access_token;
  } catch (error: any) {
    console.error('Facebook code exchange error:', error.response?.data || error.message);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to exchange Facebook authorization code: ${error.response?.data?.error?.message || error.message}`
    );
  }
  */
};

// Unified social login handler
export const handleSocialLogin = async (
  payload: SocialLoginPayload,
  req: Request,
) => {
  const page = payload?.page;
  try {
    if (!payload) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Login payload is required");
    }

    const { provider, token, code, redirect_uri } = payload;

    if (!provider) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Provider is required");
    }

    let accessToken: string;

    // Handle both access token and authorization code flows
    if (token) {
      // Direct access token flow
      accessToken = token;
    } else if (code) {
      // Authorization code flow - exchange code for access token

      accessToken = await exchangeCodeForToken(provider, code, redirect_uri);
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Either 'token' (access token) or 'code' (authorization code) is required",
      );
    }

    // Step 1: Verify token and get user data from provider
    const socialUser = await verifySocialToken(provider, accessToken);

    // Step 2: Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: socialUser.email },
      include: { client: true, adviser: true },
    });

    // Existing password-based user check
    if (user?.password) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Account already exists with email/password. Please use email login.",
      );
    }

    if (page === "login" && !user) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "User not registered! Please go to the signup page to register.",
      );
    }

    // check if the username is already taken by another user
    if (payload.username) {
      const existingUsernameUser = await prisma.user.findUnique({
        where: { username: payload.username },
      });

      if (existingUsernameUser && existingUsernameUser.id !== user?.id) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Username is already taken. Please choose a different username.",
        );
      }
    }

    // Step 3: Create new user if not exists
    if (!user) {
      // For register, validate required fields
      if (page === "register") {
        if (!payload.user_type) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "User role is required for registration.",
          );
        }
        if (!payload.username || payload.username.trim().length < 3) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Username is required and must be at least 3 characters.",
          );
        }
      }

      const data = {
        email: socialUser.email,
        name: socialUser.name || "",
        image: socialUser.picture,
        provider,
        user_type: req.body.user_type,
        username: payload.username as string,
      };

      user = await createSocialUser(data, req);
    }

    // Step 4: Generate JWT tokens
    const tokens = generateAuthTokens(user);

    return tokens;
  } catch (error: any) {
    console.error("❌ Social login error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Re-throw the error to be handled by the controller
    throw error;
  }
};

// Provider-specific token verification
const verifySocialToken = async (
  provider: string,
  token: string,
): Promise<SocialUserData> => {
  // Validate inputs
  if (!provider || typeof provider !== "string") {
    throw new Error("Provider is required and must be a string");
  }

  if (!token || typeof token !== "string") {
    throw new Error(`${provider} token is required and must be a string`);
  }

  switch (provider) {
    case "google":
      return verifyGoogleToken(token);
    case "linkedin":
      return verifyLinkedInToken(token);
    case "facebook":
      return verifyFacebookToken(token);
    default:
      throw new Error(`Invalid social provider: ${provider}`);
  }
};

// Google verification — accepts tokens from web, Android and iOS clients
const verifyGoogleToken = async (token: string): Promise<SocialUserData> => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: [
        config.google_credentials.googleClientWeb,
        config.google_credentials.googleClientAndroid,
        config.google_credentials.googleClientIos,
      ].filter(Boolean), // Filter out any undefined values
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid Google token — no email found.",
      );
    }

    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      provider: "google",
      emailVerified: payload.email_verified || false,
    };
  } catch (error: any) {
    console.error("Google token verification failed:", error.message);
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      `Google authentication failed: ${error.message}`,
    );
  }
};

// LinkedIn verification with fallback endpoints and retry logic
const verifyLinkedInToken = async (
  accessToken: string,
): Promise<SocialUserData> => {
  // Check if token is provided
  if (!accessToken || typeof accessToken !== "string") {
    throw new Error("LinkedIn access token is required and must be a string");
  }

  // Basic token validation
  if (accessToken.length < 10) {
    throw new Error(
      `LinkedIn token appears to be too short (${accessToken.length} characters). Expected a longer access token.`,
    );
  }

  // Check if token looks like a valid format (basic sanity check)
  if (!/^[A-Za-z0-9_-]+$/.test(accessToken.replace(/[.]/g, ""))) {
    console.warn(
      "LinkedIn token contains unexpected characters - this might be invalid",
    );
  }

  // Check network connectivity first

  // Try the modern LinkedIn userinfo endpoint first (works with openid, profile, email scopes)
  const endpoints = [
    "https://api.linkedin.com/v2/userinfo", // Modern OpenID Connect endpoint - preferred
    "https://api.linkedin.com/v2/me", // Legacy endpoint - requires r_liteprofile but might work
  ];

  // Add fallback endpoints only if we have broader permissions
  // Note: These require additional scopes that your app might not have requested

  for (const endpoint of endpoints) {
    // Try each endpoint with retry logic
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const requestConfig = {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // Increased to 15 second timeout
          validateStatus: (status: number) => status < 500, // Don't throw on 4xx errors
        };

        const response = await axios.get(endpoint, requestConfig);

        // Check for non-2xx status codes
        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = response.data;

        // Handle different response formats
        let email, name, picture;

        if (endpoint.includes("userinfo")) {
          // Modern OpenID Connect userinfo endpoint
          email = data.email;
          name = data.name || data.given_name || "";
          picture = data.picture;
        } else if (endpoint.includes("v2/me")) {
          // Legacy v2/me endpoint - need to fetch email separately
          name =
            data.localizedFirstName || data.firstName?.localized?.en_US || "";
          picture = data.profilePicture?.displayImage || "";

          // Try to get email from separate endpoint
          try {
            const emailResponse = await axios.get(
              "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                timeout: 15000,
                validateStatus: (status: number) => status < 500,
              },
            );

            if (emailResponse.status >= 400) {
              console.warn(
                `Email endpoint returned status ${emailResponse.status}`,
              );
              continue;
            }

            email = emailResponse.data.elements?.[0]?.["handle~"]?.emailAddress;
          } catch (emailError) {
            console.warn(
              "Could not fetch email from separate endpoint:",
              emailError,
            );
            // If email fetch fails, skip this endpoint
            continue;
          }
        } else {
          // Very old endpoint format
          name =
            data.localizedFirstName || data.firstName?.localized?.en_US || "";
          picture = data.profilePicture?.displayImage || "";
          // Skip if no email available
          continue;
        }

        if (!email) {
          console.warn(`No email found in response from ${endpoint}`);
          continue; // Try next endpoint
        }

        return {
          email,
          name,
          picture,
          provider: "linkedin",
          emailVerified: data.email_verified !== false, // Default to true if not specified
        };
      } catch (error: any) {
        console.error(
          `LinkedIn API error for ${endpoint} (attempt ${attempt}/2):`,
          {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            code: error.code,
          },
        );

        // If it's a timeout or network error and we have more attempts, retry
        if (
          attempt < 2 &&
          (error.code === "ETIMEDOUT" ||
            error.code === "ECONNABORTED" ||
            error.code === "ECONNRESET")
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue; // Try this endpoint again
        }

        // If this is the last attempt on the last endpoint, throw the error
        if (endpoint === endpoints[endpoints.length - 1] && attempt === 2) {
          if (error.response?.status === 401) {
            throw new Error("LinkedIn token is expired or invalid");
          } else if (error.response?.status === 403) {
            // Updated error message for modern scopes
            const errorData = error.response?.data;

            if (errorData?.message?.includes("people.GET")) {
              throw new Error(
                `LinkedIn OAuth Error: Your frontend is not requesting the required scopes. ` +
                  `Please update your frontend to request 'openid profile email' scopes when redirecting to LinkedIn OAuth. ` +
                  `Current error indicates missing permissions: ${errorData.message}`,
              );
            } else {
              throw new Error(
                `LinkedIn permission denied. Please ensure your frontend OAuth request includes these scopes: 'openid profile email'. ` +
                  `Error details: ${errorData?.message || error.message}`,
              );
            }
          } else if (
            error.code === "ENOTFOUND" ||
            error.code === "ECONNREFUSED"
          ) {
            throw new Error(
              `Network error connecting to LinkedIn API: ${error.message}. Please check your internet connection.`,
            );
          } else if (
            error.code === "ETIMEDOUT" ||
            error.code === "ECONNABORTED"
          ) {
            throw new Error(
              `LinkedIn API request timed out after 15 seconds: ${error.message}. This might be due to network issues or LinkedIn API being slow. Please try again.`,
            );
          } else {
            // Enhanced error reporting for undefined responses
            const errorDetails = {
              message: error.message || "Unknown error",
              status: error.response?.status || "No status",
              statusText: error.response?.statusText || "No status text",
              data: error.response?.data || "No response data",
              code: error.code || "No error code",
              headers: error.response?.headers || "No headers",
            };

            throw new Error(
              `LinkedIn token verification failed. Error details: ${JSON.stringify(errorDetails, null, 2)}`,
            );
          }
        }
        // Continue to next attempt or endpoint
        break; // Break out of attempt loop to try next endpoint
      }
    }
  }

  throw new Error(
    "LinkedIn API access failed. Please ensure your frontend requests 'openid profile email' scopes during OAuth flow.",
  );
};

// Facebook verification
const verifyFacebookToken = async (token: string): Promise<SocialUserData> => {
  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v12.0/me?fields=id,name,email,picture&access_token=${token}`,
    );

    if (!data.email) throw new Error("Email not provided by Facebook");

    return {
      email: data.email,
      name: data.name,
      picture: data.picture?.data?.url,
      provider: "facebook",
      emailVerified: true, // Facebook doesn't provide email verification status
    };
  } catch (error) {
    throw new Error("Invalid Facebook token");
  }
};

// User creation helper
const createSocialUser = async (
  data: {
    email: string;
    name: string;
    image?: string;
    provider: string;
    timezone?: string;
    user_type?: UserType;
    username: string;
  },
  req: Request,
) => {
  const referralCode = generateReferralCode(uuid());
  const referralLink = `${config.client_url}/register?referralCode=${referralCode}`;

  // 1️⃣ Get IP
  const ip = getClientIp(req);

  // 2️⃣ Get country & timezone
  const { country, timezone } = getGeoInfo(ip);

  return await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        image: data.image,
        user_type: data.user_type as UserType,
        referral_code: referralCode,
        referral_link: referralLink,
        auth_provider: data.provider,
        timezone: timezone,
        ip_address: ip,
        isSocialLogin: true,
        isPasswordSet: false, // Social login users don't set password
        isEmailVerified: true,
        country,
        currency: "USD",
        username: `@${data.username}`,
      },
    });

    // Create wallet
    await tx.wallet.create({
      data: {
        userId: user.id,
        walletCurrency: "USD",
      },
    });

    // Create client or adviser record
    if (user.user_type === "client") {
      const clientSerial = await generateClientSerial();
      await tx.client.create({
        data: { user_id: user.id, client_serial: clientSerial },
      });
    } else {
      const adviserSerial = await generateAdviserSerial();
      await tx.adviser.create({
        data: { users_id: user.id, adviser_serial: adviserSerial },
      });
    }

    // Return full user with relations
    return tx.user.findUnique({
      where: { id: user.id },
      include: { client: true, adviser: true },
    });
  });
};

// Token generation (reusable from existing code)
const generateAuthTokens = async (user: any) => {
  const { accessToken, refreshToken } = await generateUserTokens(user.id);

  return { accessToken, refreshToken };
};

export const SocialLoginSignUpServices = { handleSocialLogin };
