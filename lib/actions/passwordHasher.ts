import crypto from "crypto";

export function generateSalt() {
  // Base64 keeps the salt readable and within the database's 20 character limit.
  return crypto.randomBytes(15).toString("base64");
}

export async function hashPassword(password: string, salt: string) {
  return new Promise<string>((resolve, reject) => {
    crypto.scrypt(password.normalize(), salt, 64, (error, hash) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(hash.toString("hex").normalize());
    });
  });
}

export async function comparePassword({
  hashedPassword,
  password,
  salt,
}: {
  hashedPassword: string;
  password: string;
  salt: string;
}) {
  const inputHashedPassword = await hashPassword(password, salt);

  return crypto.timingSafeEqual(
    Buffer.from(inputHashedPassword, "hex"),
    Buffer.from(hashedPassword, "hex"),
  );
}
