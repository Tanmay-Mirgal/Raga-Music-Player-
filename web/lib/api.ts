const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
const SAAVN_BASE = 'https://saavn.sumit.co/api';

// ─── Backend API ───────────────────────────────────────────────────────────────

export async function syncUser(payload: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string;
}) {
  return fetch(`${API_BASE}/api/users/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getUserPreferences(userId: string) {
  const res = await fetch(`${API_BASE}/api/users/preferences?userId=${userId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveUserPreferences(userId: string, languages: string[], genres: string[]) {
  return fetch(`${API_BASE}/api/users/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, languages, genres }),
  });
}

export async function getPlaylists(userId: string) {
  const res = await fetch(`${API_BASE}/api/playlists?userId=${userId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createPlaylist(userId: string, title: string) {
  const res = await fetch(`${API_BASE}/api/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, title }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.playlist;
}

export async function deletePlaylist(playlistId: string) {
  return fetch(`${API_BASE}/api/playlists/${playlistId}`, { method: 'DELETE' });
}

export async function renamePlaylist(playlistId: string, title: string) {
  return fetch(`${API_BASE}/api/playlists/${playlistId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

export async function addSongToPlaylist(playlistId: string, track: any) {
  return fetch(`${API_BASE}/api/playlists/${playlistId}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track }),
  });
}

export async function removeSongFromPlaylist(playlistId: string, songId: string) {
  return fetch(`${API_BASE}/api/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE',
  });
}

export async function getLikedSongs(userId: string) {
  const res = await fetch(`${API_BASE}/api/likes?userId=${userId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function likeSong(userId: string, track: any) {
  return fetch(`${API_BASE}/api/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, track }),
  });
}

export async function unlikeSong(userId: string, songId: string) {
  return fetch(`${API_BASE}/api/likes?userId=${userId}&songId=${songId}`, {
    method: 'DELETE',
  });
}

export async function logInteraction(userId: string, track: any, interactionType: string) {
  return fetch(`${API_BASE}/api/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, track, interactionType }),
  });
}

export async function getRecommendations(userId: string) {
  const res = await fetch(`${API_BASE}/api/recommendations?userId=${userId}`);
  if (!res.ok) return [];
  return res.json();
}

// ─── Saavn Music API ─────────────────────────────────────────────────────────

export async function searchSongs(query: string, limit = 15) {
  const res = await fetch(
    `${SAAVN_BASE}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.success && data.data?.results ? data.data.results : [];
}

export async function fetchLyrics(trackName: string, artistName: string) {
  const query = `${trackName} ${artistName}`;
  const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return data[0];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function toTrack(song: any) {
  return {
    id: song.id,
    name: song.name,
    artists: {
      primary: song.artists?.primary || [{ name: 'Unknown Artist' }],
    },
    image: song.image || [],
    downloadUrl: song.downloadUrl || [],
  };
}

export function getImageUrl(images: any[], quality: 'low' | 'mid' | 'high' = 'mid') {
  if (!images || images.length === 0) return '';
  if (quality === 'high') return images[2]?.url || images[1]?.url || images[0]?.url || '';
  if (quality === 'mid') return images[1]?.url || images[0]?.url || '';
  return images[0]?.url || '';
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
