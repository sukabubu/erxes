type TExecutorConfig = {
  baseUrl?: string;
};

export type TExecutorRunPayload = {
  cookie?: string;
  keywords: string[];
  days: number;
  target: number;
  pages: number;
  count: number;
  scrollLoops: number;
  searchTimeoutMs?: number;
  filterTimeoutMs?: number;
  extraNameExcludes?: string[];
  extraCommentExcludes?: string[];
};

export type TExecutorJobState = {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  error?: string | null;
  result?: {
    outputPath?: string;
    finishedAt?: string;
  } | null;
  log?: string[];
};

export type TExecutorRunResponse = {
  ok?: boolean;
  job?: TExecutorJobState;
};

export type TExecutorJobResponse = {
  job?: TExecutorJobState;
};

export type TExecutorResultResponse = {
  outputPath?: string;
  csv?: string;
  job?: TExecutorJobState;
};

export class LeadExecutorClient {
  private baseUrl: string;

  constructor(config: TExecutorConfig = {}) {
    this.baseUrl = (config.baseUrl || process.env.CHINA_LEADS_EXECUTOR_URL || '')
      .replace(/\/$/, '');
  }

  isConfigured() {
    return Boolean(this.baseUrl);
  }

  async run(payload: TExecutorRunPayload): Promise<TExecutorRunResponse> {
    if (!this.baseUrl) {
      throw new Error('CHINA_LEADS_EXECUTOR_URL is not configured');
    }

    const response = await fetch(`${this.baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Executor run failed: ${text || response.statusText}`);
    }

    return response.json();
  }

  async getJob(jobId: string): Promise<TExecutorJobResponse> {
    if (!this.baseUrl) {
      throw new Error('CHINA_LEADS_EXECUTOR_URL is not configured');
    }

    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}`);

    if (!response.ok) {
      throw new Error(`Executor job failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getResult(jobId: string): Promise<TExecutorResultResponse> {
    if (!this.baseUrl) {
      throw new Error('CHINA_LEADS_EXECUTOR_URL is not configured');
    }

    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/result`);

    if (!response.ok) {
      throw new Error(`Executor result failed: ${response.statusText}`);
    }

    return response.json();
  }
}
