/**
 * Service for managing Learning Trails API.
 */

import { apiGet, apiPost, apiDelete, apiPatch } from './apiClient';

// Types
export interface VideoItem {
    video_url: string;
    title: string;
    duration_seconds?: number;
    order_index?: number;
}

export interface Trail {
    id: string;
    title: string;
    description?: string;
    cover_image_url?: string;
    is_public: boolean;
    created_at: string;
    video_count: number;
    completed_count: number;
    total_duration_seconds: number;
}

export interface TrailVideo {
    id: string;
    video_url: string;
    video_provider?: string;
    video_id?: string;
    title: string;
    duration_seconds?: number;
    order_index: number;
    completed: boolean;
    quiz_score?: number;
}

export interface TrailDetail extends Trail {
    videos: TrailVideo[];
}

export interface CreateTrailRequest {
    title: string;
    description?: string;
    cover_image_url?: string;
    is_public?: boolean;
    videos?: VideoItem[];
}

export interface AddVideoRequest {
    video_url: string;
    title?: string;
}

export interface ProgressUpdate {
    trail_id: string;
    video_id: string;
    watched_seconds?: number;
    completed?: boolean;
    quiz_score?: number;
}

// API Functions

export async function createTrail(data: CreateTrailRequest): Promise<Trail> {
    return apiPost('/trails', data);
}

export async function listTrails(): Promise<Trail[]> {
    return apiGet('/trails');
}

export async function getTrail(trailId: string): Promise<TrailDetail> {
    return apiGet(`/trails/${trailId}`);
}

export async function addVideoToTrail(trailId: string, data: AddVideoRequest): Promise<TrailVideo> {
    return apiPost(`/trails/${trailId}/videos`, data);
}

export async function deleteTrail(trailId: string): Promise<void> {
    return apiDelete(`/trails/${trailId}`);
}

export async function updateProgress(data: ProgressUpdate): Promise<any> {
    return apiPatch('/trails/progress', data);
}
