import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const syncUser = async (req, res) => {
  try {
    const { id, email, firstName, lastName, profileImageUrl } = req.body;

    if (!id || !email) {
      return res.status(400).json({ error: 'Missing required user sync fields' });
    }

    const user = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        firstName,
        lastName,
        profileImageUrl,
      },
      create: {
        id,
        email,
        firstName,
        lastName,
        profileImageUrl,
        preferredLanguages: [],
        preferredGenres: [],
      },
    });

    console.log(`[User Sync] User ${id} synchronized in database`);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error syncing user:', error);
    return res.status(500).json({ error: 'Failed to sync user' });
  }
};

export const getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferredLanguages: true,
        preferredGenres: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      languages: user.preferredLanguages || [],
      genres: user.preferredGenres || [],
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return res.status(500).json({ error: 'Failed to get user preferences' });
  }
};

export const saveUserPreferences = async (req, res) => {
  try {
    const { userId, languages, genres } = req.body;

    if (!userId || !languages || !genres) {
      return res.status(400).json({ error: 'Missing required preferences fields' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferredLanguages: languages,
        preferredGenres: genres,
      },
    });

    console.log(`[Preferences] User ${userId} updated preferences`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return res.status(500).json({ error: 'Failed to save preferences' });
  }
};
