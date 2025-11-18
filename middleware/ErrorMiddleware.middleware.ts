import { ZodError } from "zod";

export const ErrorMiddleware = async (req, ctx, next) => {
  try {
    return await next();
  } catch (error: unknown) {
    const err = error as Error;

    if (err instanceof ZodError) {
      ctx.logger.error("Validation Error:", {
        error: err.flatten().fieldErrors,
      });

      return {
        status: 400,
        body: {
          error: "All fields are required and must be valid.",
          details: err.flatten().fieldErrors,
        },
      };
    }

    ctx.logger.error("Internal Server Error:", { error: err.message });
    return {
      status: 500,
      body: {
        error: "Internal Server Error",
      },
    };
  }
};
