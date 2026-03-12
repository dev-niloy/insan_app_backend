import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const config = {
  node: process.env.NODE_ENV,
  port: process.env.PORT,
  frontend_urls: process.env.FRONTEND_URLS,
  api_url: process.env.API_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  },
};
export default config;
