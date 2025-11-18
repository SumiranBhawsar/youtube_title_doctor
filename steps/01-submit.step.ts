import { Handler, ApiRouteConfig } from "motia";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ErrorMiddleware } from "../middleware/ErrorMiddleware.middleware";

const createSubmitSchema = z.object({
  channel: z.string().min(1, "Channel name is required"),
  email: z.string().email("A valid email is required"),
});

type SubmitRequest = z.infer<typeof createSubmitSchema>;

export const config: ApiRouteConfig = {
  name: "SubmitChannel",
  type: "api",
  path: "/submit",
  method: "POST",
  bodySchema: createSubmitSchema,
  emits: ["yt.submit"],
  middleware: [ErrorMiddleware],
};

export const handler: Handler = async (req, { emit, logger, state }) => {
  logger.info("Received Submit Request", { body: req.body });

  // ✅ This will throw a ZodError automatically if validation fails
  const body: SubmitRequest = createSubmitSchema.parse(req.body);
  const { channel, email } = body;

  // Create a unique job ID
  const jobId = uuidv4();

  await state.set("job", jobId, {
    jobId,
    channel,
    email,
    status: "Queued",
    createdAt: new Date().toISOString(),
  });

  await emit({
    topic: "yt.submit",
    data: { jobId, channel, email },
  });

  logger.info("Job successfully queued", { jobId, channel, email });

  return {
    status: 202,
    body: {
      success: true,
      jobId,
      message:
        "Your request has been queued for processing. You will receive an email once it's completed with improved suggestions for your YouTube videos.",
    },
  };
};
