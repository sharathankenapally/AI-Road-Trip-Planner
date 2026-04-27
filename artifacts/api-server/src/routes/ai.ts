import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GetAiRecommendationsBody, GetAiMusicPlaylistBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/recommendations", async (req, res) => {
  const parsed = GetAiRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { tripRequest, currentPlan, userPreferences, question } = parsed.data as {
    tripRequest: { startLocation: string; destination: string; preferences?: string[] };
    currentPlan?: unknown;
    userPreferences?: { interests?: string[]; dietaryRestrictions?: string[]; budget?: string; travelStyle?: string };
    question?: string;
  };

  try {
    const systemPrompt = `You are an expert road trip planner and travel advisor. Provide personalized, actionable recommendations for road trips. Always respond with valid JSON matching the specified schema.`;

    const userMsg = `Plan a road trip from ${tripRequest.startLocation} to ${tripRequest.destination}.
Preferences: ${(tripRequest.preferences ?? []).join(", ") || "none specified"}
Travel style: ${userPreferences?.travelStyle ?? "general"}
Budget: ${userPreferences?.budget ?? "moderate"}
Interests: ${(userPreferences?.interests ?? []).join(", ") || "general sightseeing"}
Dietary restrictions: ${(userPreferences?.dietaryRestrictions ?? []).join(", ") || "none"}
${question ? `Specific question: ${question}` : ""}
${currentPlan ? "Current plan exists - enhance and suggest improvements." : "Create fresh recommendations."}

Respond with JSON:
{
  "recommendations": [
    {
      "category": "attraction|restaurant|activity|accommodation|tip",
      "name": "string",
      "description": "string",
      "reason": "Why this fits this specific trip",
      "estimatedTime": "e.g. 1-2 hours",
      "location": "city/area name",
      "priority": "must_see|recommended|optional"
    }
  ],
  "generalAdvice": "Overall trip advice paragraph",
  "packingTips": ["tip1", "tip2", "tip3"],
  "weatherNote": "Weather/seasonal note for this route"
}
Include 5-8 diverse recommendations across categories.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    const parsed2 = JSON.parse(content);
    res.json({ ...parsed2, alternativeStops: [] });
  } catch (err) {
    req.log.error({ err }, "AI recommendations failed");
    res.status(500).json({ error: "Failed to get AI recommendations" });
  }
});

router.post("/music", async (req, res) => {
  const parsed = GetAiMusicPlaylistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { tripRequest, mood, routeType, currentTimeOfDay, genres, language } = parsed.data as {
    tripRequest: { startLocation: string; destination: string };
    mood: string;
    routeType?: string;
    currentTimeOfDay?: string;
    genres?: string[];
    language?: string;
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: "You are a music curator specializing in road trip playlists. Create detailed, personalized playlists. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: `Create a road trip playlist for a drive from ${tripRequest.startLocation} to ${tripRequest.destination}.
Mood: ${mood}
Route type: ${routeType ?? "balanced"}
Time of day: ${currentTimeOfDay ?? "afternoon"}
Preferred genres: ${(genres ?? []).join(", ") || "open to suggestions"}
Song language: ${language ?? "English"}

IMPORTANT: All songs must be primarily in ${language ?? "English"}. Include authentic, well-known songs in that language — not just translations of English songs. If the language has a rich music tradition, celebrate it with genre-appropriate hits and hidden gems.

Respond with JSON:
{
  "playlistName": "Creative playlist name in or inspired by ${language ?? "English"}",
  "playlistDescription": "Description of the playlist vibe",
  "mood": "${mood}",
  "genres": ["genre1", "genre2"],
  "totalDuration": "e.g. 4h 30m",
  "aiCurationNote": "Why this playlist fits this trip",
  "spotifySearchUrl": "https://open.spotify.com/search/road+trip+${mood}",
  "tracks": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "duration": "3:45",
      "genre": "genre",
      "energy": "low|medium|high",
      "spotifySearchQuery": "artist song title",
      "youtubeSearchQuery": "Artist - Song Title official",
      "reason": "Why this song fits the trip"
    }
  ]
}
Include 15-20 tracks. Mix popular and hidden gems. Vary energy levels for a natural listening journey.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    res.json(JSON.parse(content));
  } catch (err) {
    req.log.error({ err }, "AI music playlist failed");
    res.status(500).json({ error: "Failed to generate music playlist" });
  }
});

export default router;
