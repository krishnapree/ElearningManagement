export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface Question {
  id: number;
  topic: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
}

export interface AIResponse {
  text: string;
  hasChart?: boolean;
  chartData?: any[];
  hasCode?: boolean;
  codeSnippet?: string;
  language?: string;
}
