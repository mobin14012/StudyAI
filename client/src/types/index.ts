export interface User {
  id: string;
  email: string;
  name: string;
  level: "junior" | "senior";
  createdAt: string;
  dailyGoal?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastActivityDate?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// --- Study Materials ---

export interface Topic {
  name: string;
  selected: boolean;
}

export interface Material {
  id: string;
  filename: string;
  fileType: "pdf" | "text";
  fileSize: number;
  textLength: number;
  topicCount: number;
  status: "processing" | "ready" | "error";
  errorMessage?: string;
  createdAt: string;
}

export interface MaterialDetail extends Omit<Material, "topicCount"> {
  extractedText: string;
  textPreview: string;
  topics: Topic[];
  summary?: string;
  summaryGeneratedAt?: string;
}

export interface MaterialListResponse {
  data: Material[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SummaryResponse {
  summary: string;
  generatedAt: string;
  cached: boolean;
}

// --- Questions ---

export type QuestionType = "mcq" | "short_answer" | "true_false";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  text: string;
  options?: string[];
  topic: string;
  materialId: string;
  createdAt: string;
}

export interface QuestionWithAnswer extends Question {
  correctAnswer: string;
  explanation: string;
}

export interface GenerateQuestionsRequest {
  materialId: string;
  topic: string;
  difficulty?: DifficultyLevel;
  types: QuestionType[];
  count?: number;
}

export interface GenerateQuestionsResponse {
  questions: Question[];
  generated: number;
  cached: number;
  totalReturned: number;
}

export interface QuestionListResponse {
  data: Question[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Practice ---

export interface PracticeQuestion {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  text: string;
  options?: string[];
  topic: string;
}

export interface PracticeSession {
  sessionId: string;
  mode: "general" | "weak_topic";
  questions: PracticeQuestion[];
  totalQuestions: number;
}

export interface StartPracticeRequest {
  mode: "general" | "weak_topic";
  materialId?: string;
  questionCount?: number;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
  timeSpentMs?: number;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
    isCorrect: boolean;
  };
  attemptId: string;
}

export interface AttemptResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
  };
}

export interface SessionResults {
  sessionId: string;
  attempts: AttemptResult[];
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
}

// --- Analytics ---

export interface OverviewStats {
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
}

export interface TopicStats {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
  isWeak: boolean;
  isMastered: boolean;
  recentAccuracy: number;
}

export interface DailyProgress {
  date: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface AnalyticsDashboard {
  overview: OverviewStats;
  topicBreakdown: TopicStats[];
  weakTopics: TopicStats[];
  dailyProgress: DailyProgress[];
  lastUpdated: string;
}

// --- Tutor ---

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorResponse {
  message: string;
  history: ChatMessage[];
}

// --- Bookmarks ---

export interface BookmarkQuestion {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  text: string;
  options?: string[];
  topic: string;
  materialId: string;
}

export interface Bookmark {
  id: string;
  question: BookmarkQuestion;
  createdAt: string;
}

// --- Notes ---

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}
