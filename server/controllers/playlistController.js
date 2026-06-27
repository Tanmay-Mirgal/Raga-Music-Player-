import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserPlaylists = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        playlistSongs: {
          include: {
            song: true,
          },
          orderBy: {
            addedAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedPlaylists = playlists.map((pl) => ({
      id: pl.id,
      title: pl.title,
      name: pl.title, // Map title to name for mobile compatibility
      coverImageUrl: pl.coverImageUrl,
      userId: pl.userId,
      createdAt: pl.createdAt,
      tracks: pl.playlistSongs.map((ps) => {
        if (ps.song.rawDataJson) {
          try {
            return JSON.parse(ps.song.rawDataJson);
          } catch (e) {
            console.error('Error parsing rawDataJson:', e);
          }
        }
        // Fallback structure
        return {
          id: ps.song.id,
          name: ps.song.name,
          artists: {
            primary: [{ name: ps.song.artist }],
          },
          image: [{ url: ps.song.imageUrl || '' }],
          downloadUrl: [],
        };
      }),
    }));

    return res.status(200).json(formattedPlaylists);
  } catch (error) {
    console.error('Error getting user playlists:', error);
    return res.status(500).json({ error: 'Failed to get user playlists' });
  }
};

export const createPlaylist = async (req, res) => {
  try {
    const { userId, title } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const playlist = await prisma.playlist.create({
      data: {
        userId,
        title,
      },
    });

    return res.status(201).json({
      success: true,
      playlist: {
        ...playlist,
        name: playlist.title,
        tracks: [],
      },
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return res.status(500).json({ error: 'Failed to create playlist' });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }

    await prisma.playlist.delete({
      where: { id },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return res.status(500).json({ error: 'Failed to delete playlist' });
  }
};

export const addSongToPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { track } = req.body;

    if (!playlistId || !track || !track.id) {
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

    // 2. Add song to playlist
    await prisma.playlistSong.upsert({
      where: {
        playlistId_songId: {
          playlistId,
          songId,
        },
      },
      update: {},
      create: {
        playlistId,
        songId,
      },
    });

    console.log(`[Playlist Add] Song ${songId} added to Playlist ${playlistId}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    return res.status(500).json({ error: 'Failed to add song to playlist' });
  }
};

export const removeSongFromPlaylist = async (req, res) => {
  try {
    const { playlistId, songId } = req.params;

    if (!playlistId || !songId) {
      return res.status(400).json({ error: 'Playlist ID and Song ID are required' });
    }

    await prisma.playlistSong.delete({
      where: {
        playlistId_songId: {
          playlistId,
          songId,
        },
      },
    });

    console.log(`[Playlist Remove] Song ${songId} removed from Playlist ${playlistId}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return res.status(500).json({ error: 'Failed to remove song from playlist' });
  }
};

export const renamePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!id || !title) {
      return res.status(400).json({ error: 'Playlist ID and title are required' });
    }

    const playlist = await prisma.playlist.update({
      where: { id },
      data: { title },
    });

    return res.status(200).json({
      success: true,
      playlist: {
        ...playlist,
        name: playlist.title,
      },
    });
  } catch (error) {
    console.error('Error renaming playlist:', error);
    return res.status(500).json({ error: 'Failed to rename playlist' });
  }
};
