import crypto from "crypto";
export function generateSalt() {
  return crypto.randomBytes(16).toString().normalize();
}

export async function hashPassword(password: string, salt: string) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize(), salt, 64, (error, hash) => {
      if (error) reject(error);

      resolve(hash.toString("hex").normalize());
    });
  });
}
