import { EventConfig, EventHandler } from "motia";

// step - 3 :
// fetch videos from youtube channel using youtube data api - 20 most recent videos

export const config: EventConfig = {
  name: "FetchVideos",
  type: "event",
  subscribes: ["yt.channel.resolved"],
  emits: ["yt.fetched.videos", "yt.fetched.videos.error"],
};

interface Video {
  videoId: string;
  title: string;
  url: string;
  publishedAt: string;
  thumbnail: string;
}

export const handler: EventHandler = async (
  eventData: any,
  { logger, emit, state }: any
) => {
  let jobId: string | undefined;
  let email: string | undefined;
  let channelName: string | undefined;
  let channelId: string | undefined;
  try {
    const data = eventData || {};

    logger.info(`FetchVideos step started with data: ${data}`);
    jobId = data.jobId;
    email = data.email;
    channelName = data.channelTitle;
    channelId = data.channelId;

    if (!jobId || !email || !channelName || !channelId) {
      logger.error(
        `Missing context - jobId: ${jobId}, email: ${email}, channelName: ${channelName}, channelId: ${channelId}`
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
      status: "Fetching Videos",
    });

    const videos: Video[] = [];

    const searchURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
      channelId
    )}&maxResults=20&order=date&type=video&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(searchURL);
    const result = await response.json();

    logger.info(
      `YouTube API response for videos of channelId ${channelId}: ${JSON.stringify(
        result
      )}`
    );

    if (result.items && result.items.length > 0) {
      for (const item of result.items) {
        videos.push({
          videoId: item.id.videoId,
          title: item.snippet.title,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.high?.url || "",
        });
      }

      logger.info("Videos fetched successfully", {
        jobId,
        channelName,
        videoCount: videos.length,
      });

      await state.set("job", jobId, {
        ...jobData,
        status: "Videos Fetched successfully",
        videos,
      });

      await emit({
        topic: "yt.fetched.videos",
        data: {
          jobId,
          email,
          channelId,
          channelName,
          videos,
        },
      });

      return;
    }

    logger.warn(`Fetched ${videos.length} videos for channelId ${channelId}`);

    await state.set("job", jobId, {
      ...jobData,
      status: "Videos Fetched Failed",
      error: "No videos found for the specified channel.",
    });

    await emit({
      topic: "yt.fetched.videos.error",
      data: {
        jobId,
        email,
        channelId,
        channelName,
        error: "No videos found for the specified channel.",
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error in FetchVideos step: ${err.message}`);

    if (!jobId || !email || !channelName) {
      logger.error(
        `Missing context - jobId: ${jobId}, email: ${email}, channelName: ${channelName}`
      );

      return;
    }

    const jobData = state.get("job", jobId);

    await state.set("job", jobId, {
      ...jobData,
      status: "error",
      error: `FetchVideos step failed: ${err.message}`,
    });

    await emit({
      topic: "yt.fetched.videos.error",
      data: {
        jobId,
        email,
        channelName,
        error: `FetchVideos step failed: ${err.message}`,
      },
    });
  }
};
