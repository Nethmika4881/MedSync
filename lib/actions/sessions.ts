import { z } from "zod";
import { userLoginRoles } from "../schemas";
import { getRedis } from "@/redis/redis";
import crypto from "crypto";
const sessionSchema = z.object({
  id: z.string(),
  role: z.enum(userLoginRoles),
});

type userSession = z.infer<typeof sessionSchema>;

const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24;
const COOKIE_SESSION_KEY = "session_id";
export type Cookies = {
  set: (
    key: string /* name of the cookkie */,
    value: string /*session id */,
    options: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "strict" | "lax";
      expires?: number;
    },
  ) => void;

  get: (key: string) => { name: string; value: string } | undefined; //pass the "session_id" and get the relavant session id from the cookkies
  delete: (
    key: string,
  ) => void; /*delete session id from the browser cookkies */
};

export async function createUserSession(user: userSession, cookie: Cookies) {
  const sessionID = crypto.randomBytes(32).toString("hex").normalize();
  const redis = await getRedis();
  await redis.set(
    `session_id:${sessionID}`,
    JSON.stringify(sessionSchema.safeParse(user)),
    {
      EX: SESSION_EXPIRATION_SECONDS,
    },
  );

  setCookie(sessionID, cookie);
}

export async function setCookie(
  session_id: string,
  cookie: Pick<Cookies, "set">,
) {
  cookie.set(COOKIE_SESSION_KEY, session_id, {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  });
}
