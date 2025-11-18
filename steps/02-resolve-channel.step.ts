import { EventConfig, EventHandler } from "motia";

// step - 2 :
// convert youtube handle/name to channel ID using youtube data api

export const config: EventConfig = {
  name: "ResolveChannel",
  type: "event",
  subscribes: ["yt.submit"],
  emits: ["yt.channel.resolved", "yt.channel.error"],
};

export const handler: EventHandler = async (
  eventData,
  { logger, emit, state }
) => {
  let jobId: string | undefined;
  let email: string | undefined;
  let channel: string | undefined;

  try {
    const data = eventData || {};

    logger.info(`ResolveChannel step started with data: ${data}`);

    jobId = data.jobId;
    email = data.email;
    channel = data.channel;

    if (!jobId || !email || !channel) {
      logger.error(
        `Missing required data: jobId=${jobId}, email=${email}, channel=${channel}`
      );
      return;
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not set in environment variables");
    }

    const jobData = await state.get("job", jobId);
    await state.set("job", jobId, {
      ...jobData,
      status: "Resolving Channel ID",
    });

    let channelId: string | null = null;
    let channelTitle: string | null = null;

    if (channel?.startsWith("@")) {
      const handle = channel.substring(1);

      const searchURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
        handle
      )}&key=${YOUTUBE_API_KEY}`;

      const response = await fetch(searchURL);
      const result = await response.json();

      logger.info(
        `YouTube API response for handle ${handle}: ${JSON.stringify(result)}`
      );

      if (result.items && result.items.length > 0) {
        channelId = result.items[0].snippet.channelId;
        channelTitle = result.items[0].snippet.channelTitle;
      }
    } else {
      const channelsURL = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=${encodeURIComponent(
        channel
      )}&key=${YOUTUBE_API_KEY}`;

      const response = await fetch(channelsURL);
      const result = await response.json();

      logger.info(
        `YouTube API response for handle ${channel}: ${result.items[0].snippet}`
      );

      if (result.items && result.items.length > 0) {
        channelId = result.items[0].id;
        channelTitle = result.items[0].snippet.title;
      }
    }

    if (!channelId) {
      logger.error(`Could not resolve channel ID for channel: ${channel}`);
      await state.set("job", jobId, {
        ...jobData,
        status: "Failed",
        error: `Could not resolve channel ID for channel: ${channel}`,
      });

      await emit({
        topic: "yt.channel.error",
        data: {
          jobId,
          email,
        },
      });

      return;
    }

    await state.set("job", jobId, {
      ...jobData,
      channelId,
      channelTitle,
      status: "Successfully Resolved Channel ID",
      error: null,
    });

    await emit({
      topic: "yt.channel.resolved",
      data: {
        jobId,
        email,
        channelId,
        channelTitle,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error in ResolveChannel step: ${err.message}`);

    if (!jobId || !email || !channel) {
      logger.error(
        `Missing context - jobId: ${jobId}, email: ${email}, channel: ${channel}`
      );

      return;
    }

    const jobData = state.get("job", jobId);

    await state.set("job", jobId, {
      ...jobData,
      status: "error",
      error: `ResolveChannel step failed: ${err.message}`,
    });

    await emit({
      topic: "yt.channel.error",
      data: {
        jobId,
        email,
        channel,
        error: `ResolveChannel step failed: ${err.message}`,
      },
    });
  }
};
