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

    // Define rating weights for direct ML matrix factorization inputs
    let weight = 1;
    if (interactionType === 'skip') weight = -1;
    else if (interactionType === 'like') weight = 3;
    else if (interactionType === 'playlist_add') weight = 2;

    // 1. Upsert SaavnSong
    await prisma.saavnSong.upsert({
      where: { id: songId },
      update: {
        name: songName,
        artist: artistName,
        album: albumName,
        imageUrl: imageUrl,
      },
      create: {
        id: songId,
        name: songName,
        artist: artistName,
        album: albumName,
        imageUrl: imageUrl,
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
