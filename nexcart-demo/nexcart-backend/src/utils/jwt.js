import jwt from "jsonwebtoken";
import { appConfig } from "../config/appConfig.js";

export function signToken(payload) {
  return jwt.sign(payload, appConfig.jwtSecret, {
    expiresIn: appConfig.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, appConfig.jwtSecret);
}