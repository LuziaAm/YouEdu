/**
 * Service for managing student progress and XP
 */

const API_BASE_URL = 'http://localhost:8000/api/students';

export interface Student {
    id: string;
    name: string;
    email?: string;
    total_xp: number;
    level: number;
    created_at: string;
}

export interface VideoSession {
    id: string;
    student_id: string;
    video_title: string;
    video_url?: string;
    video_source: 'upload' | 'youtube';
    video_duration: number;
    started_at: string;
    completed_at?: string;
    score?: number;
    time_spent?: number;
    total_challenges: number;
    challenges_completed: number;
}

export interface ChallengeAttempt {
    session_id: string;
    challenge_id: string;
    challenge_type: 'quiz' | 'code';
    is_correct: boolean;
    time_taken?: number;
    xp_earned: number;
}

export interface StudentStats {
    student: Student;
    stats: {
        total_videos_started: number;
        total_videos_completed: number;
        total_time_spent: number;
        average_score: number;
        total_challenges: number;
        challenges_correct: number;
        accuracy_percentage: number;
    };
}

class StudentProgressService {
    /**
     * Create a new student
     */
    async createStudent(name: string, email?: string): Promise<Student> {
        const response = await fetch(`${API_BASE_URL}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email }),
        });

        if (!response.ok) {
            throw new Error('Failed to create student');
        }

        return response.json();
    }

    /**
     * Get student by ID
     */
    async getStudent(studentId: string): Promise<Student> {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch student');
        }

        return response.json();
    }

    /**
     * Create a new video session
     */
    async createVideoSession(
        studentId: string,
        videoTitle: string,
        videoSource: 'upload' | 'youtube',
        videoDuration: number,
        videoUrl?: string,
        totalChallenges: number = 0
    ): Promise<VideoSession> {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: studentId,
                video_title: videoTitle,
                video_url: videoUrl,
                video_source: videoSource,
                video_duration: videoDuration,
                total_challenges: totalChallenges,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create video session');
        }

        return response.json();
    }

    /**
     * Update video session (mark as completed, set score, etc.)
     */
    async updateVideoSession(
        sessionId: string,
        updates: {
            completed_at?: string;
            score?: number;
            time_spent?: number;
            challenges_completed?: number;
        }
    ): Promise<VideoSession> {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error('Failed to update video session');
        }

        return response.json();
    }

    /**
     * Register a challenge attempt
     * This automatically adds XP to the student if correct
     */
    async registerChallengeAttempt(
        attempt: ChallengeAttempt
    ): Promise<{ id: string } & ChallengeAttempt> {
        const response = await fetch(`${API_BASE_URL}/attempts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attempt),
        });

        if (!response.ok) {
            throw new Error('Failed to register challenge attempt');
        }

        return response.json();
    }

    /**
     * Add XP directly to student (alternative to registerChallengeAttempt)
     */
    async addXP(studentId: string, xp: number): Promise<{ message: string; student: Student }> {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/add-xp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xp }),
        });

        if (!response.ok) {
            throw new Error('Failed to add XP');
        }

        return response.json();
    }

    /**
     * Get student comprehensive statistics
     */
    async getStudentStats(studentId: string): Promise<StudentStats> {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/stats`);

        if (!response.ok) {
            throw new Error('Failed to fetch student stats');
        }

        return response.json();
    }

    /**
     * Get all sessions for a student
     */
    async getStudentSessions(studentId: string, limit: number = 10): Promise<VideoSession[]> {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/sessions?limit=${limit}`);

        if (!response.ok) {
            throw new Error('Failed to fetch student sessions');
        }

        return response.json();
    }

    /**
     * Calculate XP for a challenge based on difficulty and time
     */
    calculateChallengeXP(
        isCorrect: boolean,
        challengeType: 'quiz' | 'code',
        timeTaken?: number
    ): number {
        if (!isCorrect) return 0;

        // Base XP
        let xp = challengeType === 'code' ? 50 : 25;

        // Speed bonus (if answered in < 15 seconds)
        if (timeTaken && timeTaken < 15) {
            xp += 10;
        }

        return xp;
    }
}

// Singleton instance
export const studentProgressService = new StudentProgressService();

export default studentProgressService;
