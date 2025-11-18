import { EventConfig, EventHandler } from "motia";
import { string } from "zod";

// step - 5 : send email with video titles using resend email

export const config: EventConfig = {
  name: "SendEmail",
  type: "event",
  subscribes: [
    "yt.channel.error",
    "yt.fetched.videos.error",
    "yt.enhanced.titles.error",
  ],
  emits: ["yt.error.notified"],
};

export interface ImprovedTitles {
  original: string;
  improved: string;
  rationale: string;
  url: string;
}

export const handler: EventHandler<any, any> = async (
  eventData: any,
  { logger, state, emit }: any
) => {
  try {
    let jobId: string | undefined;
    let email: string | undefined;
    let channelName: string | undefined;
    const data = eventData || {};
    jobId = data.jobId;
    email = data.email;
    channelName = data.channelName;

    const error = data.error;

    logger.info("Handling error notification : ", {
      jobId,
      email,
    });

    if (!jobId || !email || channelName) {
      logger.error(
        `Missing context - jobId: ${jobId}, email: ${email}, channelName: ${channelName}`
      );
      return;
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
    if (!RESEND_API_KEY && !RESEND_FROM_EMAIL) {
      throw new Error("Resend api key is not configured !!");
    }

    const emailText = `We are facing some issue in generating better titles for your channel: ${channelName}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [email],
        subject: `Request failed for youtube title doctor`,
        text: emailText,
      }),
    });

    if (!response.ok) {
      const errordata = await response.json();
      throw new Error(
        `Resend API error: ${errordata.error?.message} || Unknown Email error`
      );
    }

    const emailResult = await response.json();
    logger.info(
      `Error notification email sent successfully: ${emailResult.id}`
    );

    await emit({
      topic: "yt.error.notified",
      data: {
        jobId,
        email,
        channelName,
        emailId: emailResult.id,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;

    logger.error("Failed to send error notification email", {
      message: err.message,
      stack: err.stack,
    });
  }
};
