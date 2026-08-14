import jwt from "jsonwebtoken";
import env from "../config/env.js";

const generateToken = (userId) => {
  return jwt.sign(
    {
      userId
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
};

export default generateToken;