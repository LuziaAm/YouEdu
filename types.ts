
export enum ChallengeType {
  QUIZ = 'quiz',
  CODE = 'code'
}

export interface Challenge {
  id: string;
  timestamp: number; // In seconds
  timestampLabel: string; // MM:SS
  type: ChallengeType;
  title: string;
  content: string;
  options?: string[]; // For Quiz
  correctAnswer: string | number; // Index for Quiz, snippet for Code
  summary: string;
}

export interface StudentState {
  level: number;
  xp: number;
  completedChallenges: string[];
}
