import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { LeadExecutorClient, TExecutorJobState } from './executor/client';
import { ILeadItem, ISyncResult, TLeadChannel } from './types';

const toDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toLeadItem = (jobId: string, channel: TLeadChannel, row: Record<string, any>): ILeadItem => ({
  jobId,
  channel,
  keyword: row.keyword || '',
  sourcePostId: row.source_video_id || row.sourcePostId || '',
  sourcePostUrl: row.source_video_url || row.sourcePostUrl || '',
  sourceAuthor: row.source_video_author || row.sourceAuthor || '',
  sourceContent: row.source_video_desc || row.sourceContent || '',
  sourceCreatedAt: toDate(row.source_video_create_time || row.sourceCreatedAt),
  commentUserId: row.comment_unique_id || row.commentUserId || '',
  commentNickname: row.comment_nickname || row.commentNickname || '',
  commentProfileUrl: row.comment_profile_url || row.commentProfileUrl || '',
  commentText: row.comment_text || row.commentText || '',
  ipLocation: row.ip_location || row.ipLocation || '',
  score: 0,
  matchedRules: [],
  raw: row,
  syncStatus: 'pending',
});

const parseCsv = (csv: string): Record<string, string>[] => {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return [];
  }

  const splitLine = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let quoted = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];

      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (ch === ',' && !quoted) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }

    out.push(cur);
    return out;
  };

  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitLine(line);
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] || '';
      return acc;
    }, {});
  });
};

const computeScore = (
  text: string,
  positiveKeywords: string[] = [],
  scoreRules: Array<{ keyword: string; score: number }> = [],
) => {
  const normalized = (text || '').toLowerCase();
  let score = 0;
  const matchedRules: string[] = [];

  for (const keyword of positiveKeywords) {
    if (keyword && normalized.includes(keyword.toLowerCase())) {
      score += 1;
      matchedRules.push(`positive:${keyword}`);
    }
  }

  for (const rule of scoreRules) {
    if (rule.keyword && normalized.includes(rule.keyword.toLowerCase())) {
      score += Number(rule.score || 0);
      matchedRules.push(`score:${rule.keyword}`);
    }
  }

  return { score, matchedRules };
};

export const runJobWithExecutor = async (models: IModels, jobId: string) => {
  const job = await models.ChinaLeadJobs.getJob(jobId);
  const executor = new LeadExecutorClient({
    baseUrl: job.executorBaseUrl,
  });

  const config = job.configSnapshot || {};

  await models.ChinaLeadJobs.updateJob(jobId, {
    status: 'running',
    startedAt: new Date(),
    errorMessage: '',
  });

  const runResponse = await executor.run({
    cookie: config.cookie,
    keywords: config.keywords || [],
    days: Number(config.days || 1),
    target: Number(config.target || 100),
    pages: Number(config.pages || 2),
    count: Number(config.count || 50),
    scrollLoops: Number(config.scrollLoops || 28),
    searchTimeoutMs: Number(config.searchTimeoutMs || 45000),
    filterTimeoutMs: Number(config.filterTimeoutMs || 45000),
    extraNameExcludes: config.extraNameExcludes || [],
    extraCommentExcludes: config.extraCommentExcludes || [],
  });

  const executorJobId = runResponse?.job?.id;

  if (!executorJobId) {
    throw new Error('Executor did not return job id');
  }

  await models.ChinaLeadJobs.updateJob(jobId, {
    executorJobId,
  });

  let jobState: TExecutorJobState | null = null;
  for (let index = 0; index < 120; index += 1) {
    const response = await executor.getJob(executorJobId);
    jobState = response?.job || null;

    if (jobState?.status === 'succeeded') {
      break;
    }

    if (jobState?.status === 'failed') {
      throw new Error(jobState.error || 'Executor job failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!jobState || jobState.status !== 'succeeded') {
    throw new Error('Executor job timed out');
  }

  const result = await executor.getResult(executorJobId);
  const rows = parseCsv(result.csv || '');
  const items = rows.map((row) => {
    const item = toLeadItem(jobId, job.channel, row);
    const scoreInfo = computeScore(
      item.commentText || '',
      config.positiveKeywords,
      config.scoreRules,
    );

    return {
      ...item,
      score: scoreInfo.score,
      matchedRules: scoreInfo.matchedRules,
    };
  });

  await models.ChinaLeadItems.bulkReplaceForJob(jobId, items);

  await models.ChinaLeadJobs.updateJob(jobId, {
    status: 'succeeded',
    finishedAt: new Date(),
    executorJobId,
    outputPath: result.outputPath,
    resultPreview: items.slice(0, 20),
    stats: {
      rowCount: items.length,
      outputPath: result.outputPath,
      executorJobId,
    },
  });

  return models.ChinaLeadJobs.getJob(jobId);
};

export const syncJobItems = async (
  subdomain: string,
  models: IModels,
  jobId: string,
): Promise<ISyncResult> => {
  const items = await models.ChinaLeadItems.find({ jobId, syncStatus: 'pending' })
    .sort({ createdAt: 1 })
    .lean();

  const result: ISyncResult = {
    jobId,
    total: items.length,
    synced: 0,
    skipped: 0,
    failed: 0,
    customerIds: [],
    dealIds: [],
  };

  for (const item of items) {
    try {
      if (!item.commentNickname && !item.commentUserId && !item.commentText) {
        await models.ChinaLeadItems.updateOne(
          { _id: item._id },
          { $set: { syncStatus: 'skipped', syncError: 'Missing lead content' } },
        );
        result.skipped += 1;
        continue;
      }

      const customer = await sendTRPCMessage({
        subdomain,
        pluginName: 'core',
        method: 'mutation',
        module: 'customers',
        action: 'createCustomer',
        input: {
          doc: {
            firstName: item.commentNickname,
            primaryPhone: '',
            primaryEmail: '',
            visitorContactInfo: {
              source: `china-leads:${item.channel}`,
              profileUrl: item.commentProfileUrl,
              keyword: item.keyword,
              commentText: item.commentText,
            },
          },
        },
      });

      const dealResponse = await sendTRPCMessage({
        subdomain,
        pluginName: 'sales',
        method: 'mutation',
        module: 'deal',
        action: 'create',
        input: {
          name: `${item.commentNickname || '匿名线索'} - ${item.keyword || item.channel}`,
          customerIds: customer?._id ? [customer._id] : [],
          stageId: process.env.CHINA_LEADS_DEFAULT_STAGE_ID,
          description: item.commentText,
          source: item.channel,
        },
      }).catch(() => null);

      const dealId = dealResponse?.data?._id;
      const customerId = customer?._id;

      await models.ChinaLeadItems.updateOne(
        { _id: item._id },
        {
          $set: {
            syncStatus: 'synced',
            syncError: '',
            customerId,
            dealId,
            updatedAt: new Date(),
          },
        },
      );

      result.synced += 1;
      if (customerId) {
        result.customerIds.push(customerId);
      }
      if (dealId) {
        result.dealIds.push(dealId);
      }
    } catch (error) {
      await models.ChinaLeadItems.updateOne(
        { _id: item._id },
        {
          $set: {
            syncStatus: 'failed',
            syncError: error.message,
            updatedAt: new Date(),
          },
        },
      );
      result.failed += 1;
    }
  }

  return result;
};
