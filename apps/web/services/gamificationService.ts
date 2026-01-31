/**
 * Service for real-time gamification data
 */

const API_BASE = '/api/gamification';

export interface SessionStats {
    streak_days: number;
    questions_today: number;
    xp_today: number;
    last_activity: string | null;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    target: number;
    current: number;
    completed: boolean;
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    icon: string;
    reward_xp: number;
    progress: number;
    target: number;
}

export interface GamificationData {
    session: SessionStats;
    next_achievement: Achievement | null;
    missions: Mission[];
}

// Default student ID for demo - in production, this would come from auth
const DEFAULT_STUDENT_ID = 'demo-student';

class GamificationService {
    private studentId: string;

    constructor(studentId: string = DEFAULT_STUDENT_ID) {
        this.studentId = studentId;
    }

    /**
     * Get all gamification data for the dashboard
     */
    async getGamificationData(): Promise<GamificationData> {
        try {
            const response = await fetch(`${API_BASE}/gamification/${this.studentId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch gamification data');
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching gamification data:', error);
            // Return default data if API fails
            return this.getDefaultData();
        }
    }

    /**
     * Update session stats after quiz completion
     */
    async updateAfterQuiz(questionsAnswered: number, xpEarned: number, correctAnswers: number): Promise<void> {
        try {
            await fetch(`${API_BASE}/gamification/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: this.studentId,
                    questions_answered: questionsAnswered,
                    xp_earned: xpEarned,
                    correct_answers: correctAnswers
                })
            });
        } catch (error) {
            console.error('Error updating gamification stats:', error);
        }
    }

    /**
     * Add watch time to session
     */
    async addWatchTime(seconds: number): Promise<void> {
        try {
            await fetch(`${API_BASE}/gamification/add-watch-time?student_id=${this.studentId}&seconds=${seconds}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error adding watch time:', error);
        }
    }

    /**
     * Record a completed code challenge
     */
    async completeCodeChallenge(): Promise<void> {
        try {
            await fetch(`${API_BASE}/gamification/complete-code-challenge?student_id=${this.studentId}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error recording code challenge:', error);
        }
    }

    /**
     * Reset consecutive correct streak (on wrong answer)
     */
    async resetStreak(): Promise<void> {
        try {
            await fetch(`${API_BASE}/gamification/reset-streak?student_id=${this.studentId}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error resetting streak:', error);
        }
    }

    /**
     * Get default data for when API is unavailable
     */
    private getDefaultData(): GamificationData {
        return {
            session: {
                streak_days: 1,
                questions_today: 0,
                xp_today: 0,
                last_activity: null
            },
            next_achievement: {
                id: 'starter',
                name: 'Primeiro Passo',
                description: 'Complete sua primeira questão.',
                icon: '🎯',
                category: 'Início',
                target: 1,
                current: 0,
                completed: false
            },
            missions: [
                {
                    id: 'first-quiz',
                    title: 'Primeira Aula',
                    description: 'Complete um quiz',
                    icon: '📚',
                    reward_xp: 100,
                    progress: 0,
                    target: 1
                }
            ]
        };
    }
}

// Singleton instance
export const gamificationService = new GamificationService();

export default gamificationService;
