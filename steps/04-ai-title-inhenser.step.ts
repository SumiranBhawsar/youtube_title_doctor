import { EventConfig, EventHandler } from "motia";
import OpenAI from "openai";

// step - 4 : AI Title Inhenser

export const config: EventConfig = {
  name: "AITitleInhenser",
  type: "event",
  subscribes: ["yt.fetched.videos"],
  emits: ["yt.enhanced.titles", "yt.enhanced.titles.error"],
};

interface Video {
  videoId: string;
  title: string;
  url: string;
  publishedAt: string;
  thumbnail: string;
}

interface ImprovedTitle {
  original: string;
  improved: string;
  rationale: string;
  url: string;
}

export const handler: EventHandler = async (
  eventData: any,
  { logger, emit, state }: any
) => {
  let jobId: string | undefined;
  let email: string | undefined;
  let videos: Video[] | undefined;
  let channelName: string | undefined;

  try {
    const data = eventData || {};
    jobId = data.jobId;
    email = data.email;
    videos = data.videos;
    channelName = data.channelName;

    logger.info(
      `AITitleInhenser step started with data: ${jobId}, videoCount: ${videos?.length}`
    );

    if (!jobId || !email || !videos || !channelName) {
      logger.error(
        `Missing context - jobId: ${jobId}, email: ${email}, channelName: ${channelName}, videos: ${videos}`
      );
      return;
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    const jobData = await state.get("job", jobId);

    await state.set("job", jobId, {
      ...jobData,
      status: "Enhancing Titles with AI",
    });
    const videoTitles = videos
      .map((video: Video, indx: number) => `${indx + 1}. "${video.title}"`)
      .join("\n");

    const prompt = `you are a youtube title optimization expert. Your task is to enhance the titles of the following YouTube videos to maximize viewer engagement and click-through rates.
    Below are ${videos.length}
    video titles from the channel "${channelName}".
    
    For each title, provide: 
    1. an improved version that is more engaging, 
    SEO-friendly, and likely to get more clicks,

    2. A brief rationale (1-2 sentences) explaining why the new title is better.

    Guidelines: 
    - Keep the core topic and authenticity of each title intact.
    - Use action words and verbs, numbers, emotional triggers, and curiosity elements. 
    - Make it curiosity-inducing without being clickbait.
    - Optimize for relevant keywords without stuffing.
    - Optimize for searchability and clarity.

    Video Titles: ${videoTitles}

    Respond in JSON Formate: 
    {
        "titles": [
            {
               "original": "...",
               "improved": "...",
               "rationale": "..." 
            }
        ]
    }
    `;

    // const response = await fetch("https://api.openai.com/v1/chat/completions", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${OPENAI_API_KEY}`,
    //   },
    //   body: JSON.stringify({
    //     model: "gpt-3.5-turbo",
    // messages: [
    //   {
    //     role: "system",
    //     content:
    //       "You are an expert YouTube content strategist who helps improve video titles to increase viewer engagement and click-through rates.",
    //   },
    //   {
    //     role: "user",
    //     content: `${prompt}`,
    //   },
    // ],
    //     temperature: 0.7,
    //     response_format: { type: "json_object" },
    //   }),
    // });

    const openai = new OpenAI({
      apiKey: process.env.GEMINI_AI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content:
            "You are an expert YouTube content strategist who helps improve video titles to increase viewer engagement and click-through rates.",
        },
        {
          role: "user",
          content: `${prompt}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    // The OpenAI SDK returns the completion object directly (not a fetch Response).
    // Access choices[0].message.content and validate it.
    const aiResponse: any = response;
    const aiContent = aiResponse.choices?.[0]?.message?.content;
    if (!aiContent || typeof aiContent !== "string") {
      throw new Error("OpenAI returned no content for the chat completion");
    }
    const parsedContent = JSON.parse(aiContent);

    const improvedTitles: ImprovedTitle[] = parsedContent.titles.map(
      (item: any, index: number) => ({
        original: item.original,
        improved: item.improved,
        rationale: item.rationale,
        url: videos?.[index]?.url ?? "",
      })
    );
    logger.info("Titles enhanced successfully", { improvedTitles });

    await state.set("job", jobId, {
      ...jobData,
      status: "Titles Enhanced successfully",
      improvedTitles,
    });

    await emit({
      topic: "yt.enhanced.titles",
      data: {
        jobId,
        email,
        channelName,
        improvedTitles,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;

    logger.info(`AITitleInhenser step failed with error: ${err.message}`);

    if (!jobId || !email || !channelName) {
      logger.error(
        `Missing context - jobId: ${jobId}, email: ${email}, channelName: ${channelName}`
      );

      return;
    }

    const jobData = await state.get("job", jobId);

    await state.set("job", jobId, {
      ...jobData,
      status: "Error in AI Title Inhenser",
      error: "AI Title Inhenser Failed: " + err.message,
    });

    await emit({
      topic: "yt.enhanced.titles.error",
      data: {
        jobId,
        email,
        channelName,
        error: `AI Title Inhenser step failed: ${err.message}`,
      },
    });
  }
};
