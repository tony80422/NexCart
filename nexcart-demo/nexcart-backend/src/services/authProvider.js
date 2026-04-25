import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";
import { appConfig } from "../config/appConfig.js";
import { loggingService } from "./loggingService.js";

export const authProvider = {
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  },

  async comparePassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  },

  async issueToken(user) {
    if (appConfig.aws.useCognito || appConfig.authProvider === "cognito") {
      loggingService.info("Cognito-ready token flow requested", {
        userId: user._id,
        role: user.role,
      });

      return signToken({
        userId: user._id,
        role: user.role,
      });
    }

    return signToken({
      userId: user._id,
      role: user.role,
    });
  },
};