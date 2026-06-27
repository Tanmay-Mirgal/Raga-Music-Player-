import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLikedSongs = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const likedSongs = await prisma.likedSong.findMany({
      where: { userId },
      include: {
        song: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const tracks = likedSongs.map((ls) => {
      if (ls.song.rawDataJson) {
        try {
          return JSON.parse(ls.song.rawDataJson);
        } catch (e) {
          console.error('Error parsing rawDataJson for liked song:', e);
        }
      }
      // Fallback
      return {
        id: ls.song.id,
        name: ls.song.name,
        artists: {
          primary: [{ name: ls.song.artist }],
        },
        image: [{ url: ls.song.imageUrl || '' }],
        downloadUrl: [],
      };
    });

    return res.status(200).json(tracks);
  } catch (error) {
    console.error('Error getting liked songs:', error);
    return res.status(500).json({ error: 'Failed to get liked songs' });
  }
};

export const likeSong = async (req, res) => {
  try {
    const { userId, track } = req.body;

    if (!userId || !track || !track.id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const songId = track.id;
    const name = track.name;
    const artist = track.artists?.primary?.[0]?.name || 'Unknown Artist';
    const album = track.album?.name || null;
    const imageUrl = track.image?.[2]?.url || track.image?.[1]?.url || track.image?.[0]?.url || null;

    // 1. Upsert SaavnSong
    await prisma.saavnSong.upsert({
      where: { id: songId },
      update: {
        name,
        artist,
        album,
        imageUrl,
        rawDataJson: JSON.stringify(track),
      },
      create: {
        id: songId,
        name,
        artist,
        album,
        imageUrl,
        rawDataJson: JSON.stringify(track),
      },
    });

    // 2. Create LikedSong entry
    await prisma.likedSong.upsert({
      where: {
        userId_songId: {
          userId,
          songId,
        },
      },
      update: {},
      create: {
        userId,
        songId,
      },
    });

    console.log(`[Like] User ${userId} liked song ${songId}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error liking song:', error);
    return res.status(500).json({ error: 'Failed to like song' });
  }
};

export const unlikeSong = async (req, res) => {
  try {
    const { userId, songId } = req.query;

    if (!userId || !songId) {
      return res.status(400).json({ error: 'User ID and Song ID are required' });
    }

    await prisma.likedSong.delete({
      where: {
        userId_songId: {
          userId,
          songId,
        },
      },
    });

    console.log(`[Unlike] User ${userId} unliked song ${songId}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error unliking song:', error);
    return res.status(500).json({ error: 'Failed to unlike song' });
  }
};
