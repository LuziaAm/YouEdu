import { apiPost } from './apiClient';

export async function parseYouTubeUrl(url: string): Promise<{ videoId: string | null, playlistId: string | null, provider?: string, type: string }> {
    return apiPost('/youtube/parse', { url });
}
