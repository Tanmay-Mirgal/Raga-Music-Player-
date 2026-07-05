import express from 'express';
import { recordInteraction, getRecentPlays } from '../controllers/interactionController.js';
import { syncUser, getUserPreferences, saveUserPreferences } from '../controllers/userController.js';
import {
  getUserPlaylists,
  createPlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
} from '../controllers/playlistController.js';
import { getLikedSongs, likeSong, unlikeSong } from '../controllers/likeController.js';
import { getRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is healthy' });
});

// Interactions
router.post('/interactions', recordInteraction);
router.get('/interactions/recent', getRecentPlays);

// User sync & preferences
router.post('/users/sync', syncUser);
router.get('/users/preferences', getUserPreferences);
router.post('/users/preferences', saveUserPreferences);

// Playlists
router.get('/playlists', getUserPlaylists);
router.post('/playlists', createPlaylist);
router.put('/playlists/:id', renamePlaylist);
router.delete('/playlists/:id', deletePlaylist);
router.post('/playlists/:playlistId/songs', addSongToPlaylist);
router.delete('/playlists/:playlistId/songs/:songId', removeSongFromPlaylist);

// Likes
router.get('/likes', getLikedSongs);
router.post('/likes', likeSong);
router.delete('/likes', unlikeSong);

// Recommendations
router.get('/recommendations', getRecommendations);

export default router;
