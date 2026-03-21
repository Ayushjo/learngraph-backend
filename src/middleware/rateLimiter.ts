import rateLimit from "express-rate-limit";

export const contentGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.body?.studentId || req.ip,
  message: {
    success: false,
    error: "Too many requests. Please wait before generating more content.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
