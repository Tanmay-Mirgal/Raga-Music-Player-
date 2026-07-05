import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const recordInteraction = async (req, res) => {
  try {
    const { userId, track, interactionType, playDuration } = req.body;

    if (!userId || !track || !track.id || !interactionType) {
      return res.status(400).json({ error: 'Missing required interaction fields' });
    }

    const songId = track.id;
    const songName = track.name;
    const artistName = track.artists?.primary?.[0]?.name || 'Unknown Artist';
    const albumName = track.album?.name || null;
    const imageUrl = track.image?.[1]?.url || track.image?.[0]?.url || null;
    const rawDataJson = JSON.stringify(track);

    // Define rating weights for direct ML matrix factorization inputs
    let weight = 1;
    if (interactionType === 'skip') weight = -1;
    else if (interactionType === 'like') weight = 3;
    else if (interactionType === 'playlist_add') weight = 2;

    // 1. Upsert SaavnSong (saving rawDataJson for playback reconstruction)
    await prisma.saavnSong.upsert({
      where: { id: songId },
      update: {
        name: songName,
        artist: artistName,
        album: albumName,
        imageUrl: imageUrl,
        rawDataJson: rawDataJson,
      },
      create: {
        id: songId,
        name: songName,
        artist: artistName,
        album: albumName,
        imageUrl: imageUrl,
        rawDataJson: rawDataJson,
      },
    });

    // 2. Insert interaction with dynamic weighting
    const interaction = await prisma.userInteraction.create({
      data: {
        userId,
        songId,
        interactionType,
        weight,
        playDuration: playDuration ? parseInt(playDuration) : null,
      },
    });

    console.log(`[ML Log] User ${userId} -> Track ${songId} | Type: ${interactionType} | Weight: ${weight}`);
    return res.status(200).json({ success: true, interaction });
  } catch (error) {
    console.error('Error logging user interaction on server:', error);
    return res.status(500).json({ error: 'Failed to record user interaction' });
  }
};

export const getRecentPlays = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const limit = parseInt(req.query.limit) || 10;

    // Fetch user play interactions
    const interactions = await prisma.userInteraction.findMany({
      where: {
        userId,
        interactionType: 'play',
      },
      include: {
        song: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100, // Fetch more to filter duplicates in memory
    });

    // Deduplicate songs by ID while preserving order
    const seenSongIds = new Set();
    const recentTracks = [];

    for (const inter of interactions) {
      if (inter.song && !seenSongIds.has(inter.songId)) {
        seenSongIds.add(inter.songId);
        
        let trackObj = null;
        if (inter.song.rawDataJson) {
          try {
            trackObj = JSON.parse(inter.song.rawDataJson);
          } catch (e) {
            console.error('Error parsing rawDataJson:', e);
          }
        }
        
        // Fallback if rawDataJson is not available
        if (!trackObj) {
          trackObj = {
            id: inter.song.id,
            name: inter.song.name,
            album: { name: inter.song.album },
            artists: { primary: [{ name: inter.song.artist }] },
            image: [
              { url: inter.song.imageUrl || '' }, 
              { url: inter.song.imageUrl || '' }, 
              { url: inter.song.imageUrl || '' }
            ],
          };
        }

        recentTracks.push(trackObj);
        if (recentTracks.length >= limit) break;
      }
    }

    return res.status(200).json(recentTracks);
  } catch (error) {
    console.error('Error fetching recent plays:', error);
    return res.status(500).json({ error: 'Failed to fetch recent plays' });
  }
};
