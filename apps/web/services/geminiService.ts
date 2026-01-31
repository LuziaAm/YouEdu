
import { apiPost } from './apiClient';
import { Challenge } from "../types";

/**
 * Analyze video and generate educational challenges via backend API.
 * 
 * This function maintains the same interface as before, but now calls
 * the FastAPI backend instead of directly using the Gemini SDK.
 * This ensures the API key is never exposed to the client.
 * 
 * @param videoBase64 - Base64 encoded video data
 * @param mimeType - Video MIME type (e.g., 'video/mp4')
 * @returns Promise<Challenge[]> - Array of generated challenges
 */
export async function analyzeVideo(videoBase64: string, mimeType: string): Promise<Challenge[]> {
  try {
    const response = await apiPost<{ challenges: Challenge[] }>(
      '/challenges/generate',
      {
        videoBase64,
        mimeType
      }
    );

    return response.challenges;
  } catch (error) {
    console.error('Error generating challenges:', error);

    // Provide user-friendly error message
    if (error instanceof Error) {
      throw new Error('Failed to generate challenges. Please try again.');
    }

    throw new Error('An unexpected error occurred during video analysis.');
  }
}
