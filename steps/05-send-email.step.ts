import { EventConfig, EventHandler } from "motia";
import { string } from "zod";

// step - 5 : send email with video titles using resend email

export const config: EventConfig = {
  name: "SendEnhancedTitlesEmail",
  type: "event",
  subscribes: ["yt.enhanced.titles"],
  emits: ["yt.email.enhanced.titles"],
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
  let jobId: string | undefined;

  try {
    const data = eventData || {};
    jobId = data.jobId;
    const email = data.email;
    const improvedTitles: ImprovedTitles[] = data.improvedTitles;
    const channelName: string = data.channelName;

    logger.info("Sendemail step started", {
      jobId,
      TitleCount: improvedTitles.length,
    });

    if (!jobId || !email || !improvedTitles || improvedTitles.length === 0) {
      logger.error(
        `Missing context - jobId: ${jobId}, email: ${email}, channelName: ${channelName}, improvedTitles: ${improvedTitles}`
      );
      return;
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
    if (!RESEND_API_KEY && !RESEND_FROM_EMAIL) {
      throw new Error("Resend api key is not configured !!");
    }

    const jobData = await state.get("job", jobId);
    await state.set("job", jobId, {
      ...jobData,
      status: "Sending Email to user with resend",
    });

    const emailText = generateEmailText(channelName, improvedTitles);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [email],
        subject: `New titles for ${channelName}`,
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
      `Email Send Successfully: ${jobData}, EamilId: ${emailResult.id}`
    );

    await state.set("job", jobId, {
      ...jobData,
      status: "Completed",
      emailId: emailResult.id,
      completedAt: new Date().toISOString(),
    });

    await emit({
      topic: "yt.email.enhanced.titles",
      data: {
        jobId,
        email,
        emailId: emailResult.id,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;

    logger.info("Sendemail step failed with ERROR: ", { error: err.message });

    if (!jobId) {
      logger.error(`Missing Context - JOBID: ${jobId} from SendEmail step,
      Cannot Send eror notification - missing data`);

      return;
    }

    const jobData = await state.get("job", jobId);
    await state.set("job", jobId, {
      ...jobData,
      status: "failed in Send Email step",
      error: err.message,
    });

    return;
  }
};

function generateEmailText(
  channelName: string,
  titles: ImprovedTitles[]
): string {
  let text = `Youtube Title Doctor - Improved Titles for ${channelName}\n`;

  text += `${"=".repeat(60)}\n\n`;

  titles.forEach((title, index) => {
    text += `Video ${index + 1}:\n`;
    text += `-----------------\n`;
    text += `Original: ${title.original}\n`;
    text += `Improved: ${title.improved}\n`;
    text += `Why: ${title.rationale}\n`;
    text += `Watch: ${title.url}\n\n`;
  });

  text += `${"=".repeat(60)}\n`;
  text += `Powered by Motia.dev\n`;

  return text;
}
