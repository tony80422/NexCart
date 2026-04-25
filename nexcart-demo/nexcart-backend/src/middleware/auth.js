import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: token missing" });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
}