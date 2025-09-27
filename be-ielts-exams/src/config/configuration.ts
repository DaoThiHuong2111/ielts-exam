import fs from "fs";

// Helper functions to read RSA keys
function getPrivateKey(): Buffer {
  const keyPath = process.env.APP_KEY_PATH || "./keys/key.pem";
  try {
    return fs.readFileSync(keyPath);
  } catch {
    throw new Error(`Cannot read RSA private key at ${keyPath}. Please run ./generate-keys.sh`);
  }
}

function getPublicKey(): Buffer {
  const keyPath = process.env.APP_PUBLIC_KEY_PATH || "./keys/key.public.pem";
  try {
    return fs.readFileSync(keyPath);
  } catch {
    throw new Error(`Cannot read RSA public key at ${keyPath}. Please run ./generate-keys.sh`);
  }
}

export default {
  port: parseInt(process.env.PORT, 10) || 8228,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || parseInt(process.env.DATABASE_PORT || '3306')
  },

  // RSA Keys for JWT signing
  jwt: {
    privateKey: getPrivateKey(),
    publicKey: getPublicKey(),
    accessTokenExpires: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshTokenExpires: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
  },

  // Legacy - kept for compatibility (will be removed after RSA migration)
  appKey: getPrivateKey(),
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || "access_token_secret",
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || "refresh_token_secret",
  passwordResetSecret: process.env.JWT_PASSWORD_RESET_SECRET || "password_reset_secret",
  accessTokenExpires: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshTokenExpires: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  passwordResetExpires: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || "1h",

  databaseUrl: process.env.DATABASE_URL,
  uploadPath: process.env.UPLOAD_PATH || "./public/uploads/tmp"
};
