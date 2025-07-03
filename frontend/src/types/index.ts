export interface User {
  id: number;
  name: string;
  email: string;
  subscription_status: string;
  role?: "admin" | "lecturer" | "student" | "parent";
  student_id?: string;
  employee_id?: string;
}

export interface Question {
  id: number;
  topic: string;
  question_text: string;
  correct_answer: string;
  options: string[];
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  question_id: number;
  is_correct: boolean;
  timestamp: string;
}

export interface AIResponse {
  text: string;
  hasChart?: boolean;
  chartData?: any[];
  hasCode?: boolean;
  codeSnippet?: string;
  language?: string;
}

export interface ProgressData {
  date: string;
  score: number;
  topic?: string;
}

export interface TopicPerformance {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned_date: string;
  icon: string;
}

export interface DashboardData {
  overall_score: number;
  total_questions: number;
  correct_answers: number;
  recent_activity: ProgressData[];
  topic_performance: TopicPerformance[];
  streak: number;
  achievements: Achievement[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
