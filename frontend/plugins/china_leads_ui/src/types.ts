export type TScoreRule = {
  keyword: string;
  score: number;
};

export type TChinaLeadRuleSet = {
  _id: string;
  name: string;
  description?: string;
  channel: string;
  keywords: string[];
  days: number;
  target: number;
  pages: number;
  count: number;
  scrollLoops: number;
  extraNameExcludes: string[];
  extraCommentExcludes: string[];
  positiveKeywords: string[];
  autoSync: boolean;
  isActive: boolean;
  scoreRules: TScoreRule[];
  createdAt?: string;
  updatedAt?: string;
};

export type TChinaLeadJob = {
  _id: string;
  ruleSetId?: string;
  name: string;
  channel: string;
  status: string;
  executorBaseUrl?: string;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
  outputPath?: string;
  stats?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type TChinaLeadItem = {
  _id: string;
  jobId: string;
  channel: string;
  keyword?: string;
  sourcePostUrl?: string;
  sourceAuthor?: string;
  commentNickname?: string;
  commentProfileUrl?: string;
  commentText?: string;
  ipLocation?: string;
  score?: number;
  matchedRules: string[];
  syncStatus: string;
  syncError?: string;
  customerId?: string;
  dealId?: string;
};
