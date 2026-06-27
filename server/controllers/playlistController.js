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

    let artPrompt = `${title} music playlist album cover art, clean minimal vector illustration, modern design`;
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      try {
        console.log(`[Cover Gen] Generating prompt for playlist "${title}" using Groq`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'You are an art director. Generate a short, highly descriptive image prompt (maximum 20 words) for a playlist cover art based on the playlist title. Your output must be ONLY the prompt text, no introductory words, no quotes, no conversational filler.'
              },
              { role: 'user', content: `Playlist Title: "${title}"` },
            ],
            temperature: 0.8,
          }),
        });

        if (response.ok) {
          const completion = await response.json();
          const responseText = completion.choices?.[0]?.message?.content?.trim();
          if (responseText) {
            artPrompt = responseText;
            console.log(`[Cover Gen] Groq generated prompt: "${artPrompt}"`);
          }
        }
      } catch (e) {
        console.error('[Cover Gen] Groq prompt generation failed, falling back to default prompt:', e);
      }
    }

    // Generate a unique seed to ensure unique images for duplicate playlist titles
    const seed = Math.floor(Math.random() * 1000000);
    const coverImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(artPrompt)}?width=500&height=500&nologo=true&seed=${seed}`;

    const playlist = await prisma.playlist.create({
      data: {
        userId,
        title,
        coverImageUrl,
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
