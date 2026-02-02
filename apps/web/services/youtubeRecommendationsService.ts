/**
 * Service for fetching YouTube video recommendations
 */

const API_BASE = '/api/youtube';

export interface VideoRecommendation {
    video_id: string;
    title: string;
    channel: string;
    thumbnail: string;
    views: string;
    published_at: string;
    url: string;
}

class YouTubeRecommendationsService {
    private cache: VideoRecommendation[] | null = null;
    private cacheTimestamp: number | null = null;
    private cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds

    /**
     * Get recommended educational videos from YouTube
     */
    async getRecommendations(): Promise<VideoRecommendation[]> {
        // Check cache
        if (this.cache && this.cacheTimestamp &&
            Date.now() - this.cacheTimestamp < this.cacheDuration) {
            return this.cache;
        }

        try {
            const response = await fetch(`${API_BASE}/youtube/recommendations`);

            if (!response.ok) {
                throw new Error('Failed to fetch recommendations');
            }

            const data = await response.json();
            this.cache = data;
            this.cacheTimestamp = Date.now();

            return data;
        } catch (error) {
            console.error('Error fetching video recommendations:', error);
            // Return fallback data
            return this.getFallbackRecommendations();
        }
    }

    /**
     * Fallback recommendations if API fails
     */
    private getFallbackRecommendations(): VideoRecommendation[] {
        return [
            {
                video_id: 'rfscVS0vtbw',
                title: 'Learn Python - Full Course for Beginners',
                channel: 'freeCodeCamp.org',
                thumbnail: 'https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg',
                views: '45M views',
                published_at: '2024',
                url: 'https://www.youtube.com/watch?v=rfscVS0vtbw'
            },
            {
                video_id: 'PkZNo7MFNFg',
                title: 'Learn JavaScript - Full Course',
                channel: 'freeCodeCamp.org',
                thumbnail: 'https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg',
                views: '18M views',
                published_at: '2024',
                url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg'
            },
            {
                video_id: 'kqtD5dpn9C8',
                title: 'Python for Beginners - Learn in 1 Hour',
                channel: 'Programming with Mosh',
                thumbnail: 'https://i.ytimg.com/vi/kqtD5dpn9C8/hqdefault.jpg',
                views: '28M views',
                published_at: '2024',
                url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8'
            }
        ];
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache = null;
        this.cacheTimestamp = null;
    }
}

// Singleton instance
export const youtubeRecommendationsService = new YouTubeRecommendationsService();

export default youtubeRecommendationsService;
