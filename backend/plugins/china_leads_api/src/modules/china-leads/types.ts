import { Document, Model } from 'mongoose';

export type TLeadChannel = 'douyin' | 'xiaohongshu';
export type TJobStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'partial';
export type TSyncStatus = 'pending' | 'synced' | 'skipped' | 'failed';

export interface IRuleSet {
  name: string;
  description?: string;
  channel: TLeadChannel;
  keywords: string[];
  days: number;
  target: number;
  pages: number;
  count: number;
  scrollLoops: number;
  extraNameExcludes: string[];
  extraCommentExcludes: string[];
  positiveKeywords?: string[];
  scoreRules?: Array<{ keyword: string; score: number }>;
  autoSync?: boolean;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRuleSetDocument extends IRuleSet, Document {
  _id: string;
}

export interface IJob {
  ruleSetId?: string;
  name: string;
  channel: TLeadChannel;
  status: TJobStatus;
  configSnapshot: Record<string, any>;
  executorBaseUrl?: string;
  executorJobId?: string;
  startedAt?: Date;
  finishedAt?: Date;
  errorMessage?: string;
  stats?: Record<string, any>;
  outputPath?: string;
  resultPreview?: any[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJobDocument extends IJob, Document {
  _id: string;
}

export interface ILeadItem {
  jobId: string;
  channel: TLeadChannel;
  keyword?: string;
  sourcePostId?: string;
  sourcePostUrl?: string;
  sourceAuthor?: string;
  sourceContent?: string;
  sourceCreatedAt?: Date;
  commentUserId?: string;
  commentNickname?: string;
  commentProfileUrl?: string;
  commentText?: string;
  ipLocation?: string;
  score?: number;
  matchedRules?: string[];
  raw: Record<string, any>;
  syncStatus: TSyncStatus;
  syncError?: string;
  customerId?: string;
  dealId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILeadItemDocument extends ILeadItem, Document {
  _id: string;
}

export interface ISyncResult {
  jobId: string;
  total: number;
  synced: number;
  skipped: number;
  failed: number;
  customerIds: string[];
  dealIds: string[];
}

export interface IRuleSetModel extends Model<IRuleSetDocument> {
  getRuleSet(_id: string): Promise<IRuleSetDocument>;
  createRuleSet(doc: IRuleSet): Promise<IRuleSetDocument>;
  updateRuleSet(_id: string, doc: Partial<IRuleSet>): Promise<IRuleSetDocument>;
  removeRuleSet(_id: string): Promise<void>;
}

export interface IJobModel extends Model<IJobDocument> {
  getJob(_id: string): Promise<IJobDocument>;
  createJob(doc: IJob): Promise<IJobDocument>;
  updateJob(_id: string, doc: Partial<IJob>): Promise<IJobDocument>;
}

export interface ILeadItemModel extends Model<ILeadItemDocument> {
  createLeadItem(doc: ILeadItem): Promise<ILeadItemDocument>;
  bulkReplaceForJob(jobId: string, docs: ILeadItem[]): Promise<number>;
}
