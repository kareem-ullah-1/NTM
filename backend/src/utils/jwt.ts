import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;

  adminRole?: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
    algorithm: "HS256"
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] }) as JwtPayload;
}
