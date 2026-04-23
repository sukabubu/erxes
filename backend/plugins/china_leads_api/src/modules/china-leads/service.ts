import { createHash } from 'crypto';
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

const toSyntheticCommentUserId = (row: Record<string, any>) => {
  const fallbackParts = [
    row.comment_profile_url,
    row.comment_nickname,
    row.comment_text,
    row.source_video_id,
    row.source_video_url,
    row.keyword,
  ]
    .map((value) => `${value || ''}`.trim())
    .filter(Boolean);

  if (!fallbackParts.length) {
    return '';
  }

  return `synthetic:${createHash('sha1').update(fallbackParts.join('|')).digest('hex')}`;
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
  commentUserId: row.comment_unique_id || row.commentUserId || toSyntheticCommentUserId(row),
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

const toPositiveNumber = (value: any, fallback: number) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0
    ? numberValue
    : fallback;
};

const parseIdList = (value?: string) =>
  `${value || ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const formatLeadTimestamp = (value?: Date) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

const buildLeadDescription = (item: ILeadItem) => {
  const lines = [
    '来源渠道: 抖音',
    `抖音昵称: ${item.commentNickname || '未提供'}`,
    `抖音主页: ${item.commentProfileUrl || '未提供'}`,
    `关联视频: ${item.sourcePostUrl || '未提供'}`,
    `视频发布时间: ${formatLeadTimestamp(item.sourceCreatedAt) || '未提供'}`,
    `命中关键词: ${item.keyword || item.channel}`,
    `评论内容: ${item.commentText || '未提供'}`,
    `地区: ${item.ipLocation || '未提供'}`,
    '',
    '建议跟进漏斗: 抖音触达 -> 转微信 -> 电话沟通 -> 线下拜访 -> 成交',
  ];

  return lines.join('\n');
};

const resolveSalesStage = async (subdomain: string) => {
  const explicitStageId = process.env.CHINA_LEADS_DEFAULT_STAGE_ID;

  if (explicitStageId) {
    return { stageId: explicitStageId };
  }

  const stageResponse = await sendTRPCMessage({
    subdomain,
    pluginName: 'sales',
    method: 'query',
    module: 'stage',
    action: 'find',
    input: {
      type: 'deal',
      status: 'active',
    },
    defaultValue: { data: [] },
  }).catch(() => ({ data: [] }));

  const [firstStage] = stageResponse?.data || [];

  return {
    stageId: firstStage?._id,
  };
};

export const runJobWithExecutor = async (models: IModels, jobId: string) => {
  const job = await models.ChinaLeadJobs.getJob(jobId);
  const config = job.configSnapshot || {};
  const executor = new LeadExecutorClient({
    baseUrl: job.executorBaseUrl || config.executorBaseUrl,
  });
  const searchTimeoutMs = toPositiveNumber(config.searchTimeoutMs, 180000);
  const filterTimeoutMs = toPositiveNumber(config.filterTimeoutMs, 180000);

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
    searchTimeoutMs,
    filterTimeoutMs,
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
  const pollIntervalMs = 1000;
  const executorWaitMs = Math.max(
    searchTimeoutMs + filterTimeoutMs + 60000,
    120000,
  );
  const deadline = Date.now() + executorWaitMs;

  while (Date.now() < deadline) {
    const response = await executor.getJob(executorJobId);
    jobState = response?.job || null;

    if (jobState?.status === 'succeeded') {
      break;
    }

    if (jobState?.status === 'failed') {
      throw new Error(jobState.error || 'Executor job failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  if (!jobState || jobState.status !== 'succeeded') {
    const minutes = Math.ceil(executorWaitMs / 60000);
    throw new Error(
      `Executor job timed out after ${minutes} minutes; executorJobId=${executorJobId}`,
    );
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

  const { stageId } = await resolveSalesStage(subdomain);
  const assignedUserIds = parseIdList(process.env.CHINA_LEADS_ASSIGNED_USER_IDS);

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
            state: 'lead',
            firstName: '',
            lastName: '',
            primaryPhone: '',
            primaryEmail: '',
            description: '抖音线索，待销售补充微信、电话和真实姓名。',
            links: {
              douyinProfile: item.commentProfileUrl || '',
              douyinVideo: item.sourcePostUrl || '',
            },
            data: {
              source: 'douyin',
              sourceLabel: '抖音',
              douyinNickname: item.commentNickname || '',
              douyinProfileUrl: item.commentProfileUrl || '',
              douyinVideoUrl: item.sourcePostUrl || '',
              douyinCommentText: item.commentText || '',
              douyinKeyword: item.keyword || '',
              douyinPublishedAt: formatLeadTimestamp(item.sourceCreatedAt),
            },
          },
        },
      });

      const dealResponse = stageId
        ? await sendTRPCMessage({
            subdomain,
            pluginName: 'sales',
            method: 'mutation',
            module: 'deal',
            action: 'create',
            input: {
              name: `[抖音线索] ${item.commentNickname || '匿名用户'} - ${item.keyword || item.channel}`,
              customerIds: customer?._id ? [customer._id] : [],
              stageId,
              assignedUserIds,
              description: buildLeadDescription(item),
              extraData: {
                source: 'douyin',
                sourceLabel: '抖音',
                channel: item.channel,
                commentNickname: item.commentNickname || '',
                commentProfileUrl: item.commentProfileUrl || '',
                sourcePostUrl: item.sourcePostUrl || '',
                sourceCreatedAt: formatLeadTimestamp(item.sourceCreatedAt),
                keyword: item.keyword || '',
                funnelModel: [
                  '抖音触达',
                  '转微信',
                  '电话沟通',
                  '线下拜访',
                  '成交',
                ],
              },
            },
          }).catch(() => null)
        : null;

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
