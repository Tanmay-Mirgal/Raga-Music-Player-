import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // 1. Fetch user profile and preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        likedSongs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { song: true },
        },
        interactions: {
          where: { interactionType: 'play' },
          take: 15,
          orderBy: { timestamp: 'desc' },
          include: { song: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferredLanguages = user.preferredLanguages || [];
    const preferredGenres = user.preferredGenres || [];
    
    const likedTracksInfo = user.likedSongs.map((ls) => ({
      name: ls.song.name,
      artist: ls.song.artist,
    }));

    const recentlyPlayedInfo = user.interactions.map((i) => ({
      name: i.song.name,
      artist: i.song.artist,
    }));

    let recommendedTracks = [];
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      console.log(`[Smart Mix] Generating AI recommendations using Groq for user ${userId}`);
      try {
        const systemPrompt = `You are Raga AI, a professional music recommendation assistant. Your task is to recommend 10 songs based on the user's profile which contains preferred languages, preferred genres, recently liked songs, and recently played songs.
Return your output ONLY as a JSON object of this structure:
{
  "recommendations": [
    { "songName": "Song Title", "artistName": "Artist Name" }
  ]
}
Ensure the recommendations match the languages and genres the user likes, and are similar in vibe or style to their liked/played songs. Provide popular and matching tracks. Do not output any conversational text or markdown, only the raw JSON.`;

        const userProfile = {
          preferredLanguages,
          preferredGenres,
          recentlyLikedSongs: likedTracksInfo,
          recentlyPlayedSongs: recentlyPlayedInfo,
        };

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: JSON.stringify(userProfile) },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const completion = await response.json();
          const responseText = completion.choices?.[0]?.message?.content;
          if (responseText) {
            const parsed = JSON.parse(responseText);
            const rawRecommendations = parsed.recommendations || [];

            console.log(`[Smart Mix] Groq recommended ${rawRecommendations.length} songs. Fetching details from JioSaavn...`);

            // For each recommendation, search on JioSaavn and take the first result
            const searchPromises = rawRecommendations.map(async (rec) => {
              try {
                const searchRes = await fetch(
                  `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(rec.songName + ' ' + rec.artistName)}&limit=1`
                );
                if (searchRes.ok) {
                  const searchData = await searchRes.json();
                  if (searchData.success && searchData.data?.results && searchData.data.results.length > 0) {
                    return searchData.data.results[0];
                  }
                }
              } catch (e) {
                console.error(`JioSaavn search failed for ${rec.songName}:`, e);
              }
              return null;
            });

            const searchResults = await Promise.all(searchPromises);
            recommendedTracks = searchResults.filter((track) => track !== null);
          }
        } else {
          console.error('[Smart Mix] Groq API returned error:', await response.text());
        }
      } catch (e) {
        console.error('[Smart Mix] Failed to fetch Groq recommendations:', e);
      }
    }

    // Fallback: If Groq key not set, API fails, or returns 0 tracks, use the heuristics fallback
    if (recommendedTracks.length === 0) {
      console.log(`[Smart Mix] Groq failed or not set. Falling back to Saavn suggestions heuristic.`);
      let seedSongIds = user.likedSongs.slice(0, 3).map((ls) => ls.songId);
      if (seedSongIds.length === 0) {
        seedSongIds = user.interactions.slice(0, 3).map((i) => i.songId);
      }

      if (seedSongIds.length > 0) {
        const suggestionPromises = seedSongIds.map(async (id) => {
          try {
            const res = await fetch(`https://saavn.sumit.co/api/songs/${id}/suggestions?limit=10`);
            if (res.ok) {
              const result = await res.json();
              return result.success && Array.isArray(result.data) ? result.data : [];
            }
          } catch (e) {
            console.error(e);
          }
          return [];
        });

        const suggestionsResults = await Promise.all(suggestionPromises);
        const allSuggestions = suggestionsResults.flat();
        
        const seenIds = new Set();
        for (const track of allSuggestions) {
          if (!seenIds.has(track.id)) {
            seenIds.add(track.id);
            recommendedTracks.push(track);
          }
        }
      }

      // 2nd Tier Fallback: search preferences
      if (recommendedTracks.length === 0) {
        const lang = preferredLanguages[0] || 'hindi';
        const genre = preferredGenres[0] || 'lofi';
        const query = `${lang} ${genre}`;

        try {
          const response = await fetch(`https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}&limit=15`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.results) {
              recommendedTracks = result.data.results;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    return res.status(200).json(recommendedTracks);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};
