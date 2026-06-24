export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  html_url: string;
  language: string | null;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string | null;
  // Details populated by fetching single PR
  changed_files?: number;
  additions?: number;
  deletions?: number;
  // UI indicators
  reviewScore?: number;
  hasReview?: boolean;
}

export interface ReviewSettings {
  bugs: boolean;
  performance: boolean;
  security: boolean;
  style: boolean;
}

export interface ReviewBug {
  file: string;
  line: number;
  description: string;
}

export interface ReviewSuggestion {
  file: string;
  line: number;
  description: string;
}

export interface ReviewPerformance {
  file: string;
  description: string;
}

export interface ReviewSecurity {
  file: string;
  description: string;
}

export interface AIReviewContent {
  bugs: ReviewBug[];
  sugerencias: ReviewSuggestion[];
  performance: ReviewPerformance[];
  security: ReviewSecurity[];
  score: number;
  justification: string;
}

export interface SavedReview {
  id: string;
  user_id: string;
  repo_name: string;
  repo_owner: string;
  pr_number: number;
  pr_title: string;
  pr_url: string;
  review_content: AIReviewContent;
  score: number;
  created_at: string;
}
