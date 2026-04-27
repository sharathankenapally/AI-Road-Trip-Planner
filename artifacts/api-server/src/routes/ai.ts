import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GetAiRecommendationsBody, GetAiMusicPlaylistBody, GetMustVisitPlacesBody, GetRestStopsBody } from "@workspace/api-zod";

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

router.post("/rest-stops", async (req, res) => {
  const parsed = GetRestStopsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { startLocation, destination, startTime, totalDistance } = parsed.data;
  const departureHour = new Date(startTime).getUTCHours();
  const timeLabel = departureHour >= 20
    ? "evening/night"
    : departureHour < 6
    ? "late night/early morning"
    : "night";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4096,
      messages: [
        {
          role: "system",
          content: "You are a road trip safety advisor with expertise in overnight travel planning. You recommend real, specific rest stops, motels, and safe overnight options along US and international routes. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: `A traveler is making a road trip from ${startLocation} to ${destination}${totalDistance ? ` (approximately ${totalDistance})` : ""}. They are departing in the ${timeLabel} (local departure time is around ${departureHour}:00).

Suggest 4-6 real, specific places to stop and rest along this route — mix of motels, rest areas, truck stops, and/or campgrounds depending on what's realistic for this route.

Also provide:
1. A safety tip specific to late-night driving on this type of route
2. Practical driving advice for overnight travel on this route

Respond with JSON:
{
  "restStops": [
    {
      "name": "Real specific place name (e.g. Holiday Inn Express, Flying J Travel Center, etc.)",
      "type": "motel|rest_area|truck_stop|hotel|campground",
      "location": "City, State",
      "approximateMileage": "e.g. ~120 miles from ${startLocation}",
      "amenities": ["WiFi", "Fuel", "Food", "Restrooms", "Showers", "24-hour"],
      "priceRange": "e.g. $60-90/night (omit for free rest areas)",
      "notes": "Brief description: why this stop is good, what to expect, any notable features",
      "recommendedFor": "e.g. Quick 2-hour rest, Overnight sleep, Fuel + coffee break"
    }
  ],
  "safetyTip": "A specific safety warning relevant to this route at night (fatigue, wildlife, weather, etc.)",
  "drivingAdvice": "Practical advice for driving this route at night (best sections, speed limits, rest interval, etc.)"
}

Only include REAL places that actually exist on or very near the ${startLocation} to ${destination} route.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");
    res.json(JSON.parse(content));
  } catch (err) {
    req.log.error({ err }, "Rest stops generation failed");
    res.status(500).json({ error: "Failed to generate rest stop suggestions" });
  }
});

router.post("/must-visit", async (req, res) => {
  const parsed = GetMustVisitPlacesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { startLocation, destination } = parsed.data;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: "You are an expert travel guide with deep knowledge of tourist attractions, landmarks, and hidden gems worldwide. Always recommend real, specific places that actually exist. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: `Give me the must-visit places for a road trip from ${startLocation} to ${destination}.

Return TWO categories:
1. "enRoute" - real, notable places and attractions that are on or close to the route between ${startLocation} and ${destination}
2. "atDestination" - the top must-visit attractions, landmarks, and experiences at ${destination}

Also include a short "destinationOverview" paragraph about ${destination} (2-3 sentences on what makes it worth visiting).

Respond with JSON:
{
  "destinationOverview": "What makes ${destination} special and worth visiting",
  "enRoute": [
    {
      "name": "Exact real place name",
      "category": "landmark|park|museum|viewpoint|historic|beach|temple|fort|market|garden|waterfall|palace|nature|religious",
      "location": "City or area name",
      "description": "2-3 sentence description of the place",
      "why": "Specific reason why this is worth a stop on this route",
      "estimatedTime": "e.g. 1-2 hours",
      "approximateDistance": "e.g. 120 miles from ${startLocation}",
      "tips": "Practical tip for visiting (best time, entry fee, parking, etc.)"
    }
  ],
  "atDestination": [
    {
      "name": "Exact real place name",
      "category": "landmark|park|museum|viewpoint|historic|beach|temple|fort|market|garden|waterfall|palace|nature|religious",
      "description": "2-3 sentence description",
      "why": "Why this is a must-see at ${destination}",
      "estimatedTime": "e.g. 2-3 hours",
      "tips": "Practical tip for visiting"
    }
  ]
}

Include 4-6 enRoute places and 6-8 atDestination places. Only include REAL places that actually exist. Be specific with names — no generic descriptions.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");
    res.json(JSON.parse(content));
  } catch (err) {
    req.log.error({ err }, "Must-visit places generation failed");
    res.status(500).json({ error: "Failed to generate must-visit places" });
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
          content: "You are a music curator specializing in road trip playlists. You strictly follow the language requirement — every single track you recommend must be a song whose lyrics are primarily in the requested language. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: `Create a road trip playlist for a drive from ${tripRequest.startLocation} to ${tripRequest.destination}.
Mood: ${mood}
Route type: ${routeType ?? "balanced"}
Time of day: ${currentTimeOfDay ?? "afternoon"}
Preferred genres: ${(genres ?? []).join(", ") || "open to suggestions"}
REQUIRED SONG LANGUAGE: ${language ?? "English"}

CRITICAL RULES:
1. Every single track MUST have lyrics primarily in ${language ?? "English"}.
2. Do NOT include any songs in other languages.
3. Use real, well-known artists who sing in ${language ?? "English"}.
4. Celebrate the ${language ?? "English"} music scene — include a mix of classic hits and modern popular songs.
5. The playlist name and description should reflect ${language ?? "English"} musical culture.

Respond with JSON:
{
  "playlistName": "Playlist name reflecting ${language ?? "English"} music culture",
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
