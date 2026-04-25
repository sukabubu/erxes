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

  return `synthetic:${createHash('sha1')
    .update(fallbackParts.join('|'))
    .digest('hex')}`;
};

const toLeadItem = (
  jobId: string,
  channel: TLeadChannel,
  row: Record<string, any>,
): ILeadItem => ({
  jobId,
  channel,
  keyword: row.keyword || '',
  sourcePostId: row.source_video_id || row.sourcePostId || '',
  sourcePostUrl: row.source_video_url || row.sourcePostUrl || '',
  sourceAuthor: row.source_video_author || row.sourceAuthor || '',
  sourceContent: row.source_video_desc || row.sourceContent || '',
  sourceCreatedAt: toDate(row.source_video_create_time || row.sourceCreatedAt),
  commentUserId:
    row.comment_unique_id || row.commentUserId || toSyntheticCommentUserId(row),
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

const DEFAULT_CUSTOMER_DESCRIPTION =
  '抖音线索，待销售补充微信、电话和真实姓名。';

const FUNNEL_MODEL = ['抖音触达', '转微信', '电话沟通', '线下拜访', '成交'];

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: '待触达',
  attemptedToContact: '已触达',
  inProgress: '跟进中',
  badTiming: '暂缓跟进',
  unqualified: '无效线索',
  '': '待触达',
};

const uniqueStrings = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.filter(Boolean).map((value) => `${value}`.trim())));

const toLeadIdentity = (item: ILeadItem) => {
  const rawIdentity =
    item.commentUserId ||
    item.commentProfileUrl ||
    item.sourcePostId ||
    item.sourcePostUrl ||
    `${item.commentNickname || ''}|${item.commentText || ''}|${
      item.keyword || ''
    }`;

  return `douyin:${createHash('sha1').update(rawIdentity).digest('hex')}`;
};

const getCustomerLink = (customerId?: string) =>
  customerId ? `/contacts/customers?contactId=${customerId}` : '';

const normalizeTagName = (prefix: string, value?: string) => {
  const normalized = `${value || ''}`.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return prefix;
  }

  return `${prefix} ${normalized.slice(0, 48)}`;
};

const buildCustomerData = (
  item: ILeadItem,
  existingData: Record<string, any> = {},
) => ({
  ...existingData,
  leadSource: 'china_leads',
  source: 'douyin',
  sourceLabel: '抖音',
  channel: item.channel,
  douyinCommentUserId:
    item.commentUserId || existingData.douyinCommentUserId || '',
  douyinNickname: item.commentNickname || existingData.douyinNickname || '',
  douyinProfileUrl:
    item.commentProfileUrl || existingData.douyinProfileUrl || '',
  douyinVideoUrl: item.sourcePostUrl || existingData.douyinVideoUrl || '',
  douyinCommentText: item.commentText || existingData.douyinCommentText || '',
  douyinKeyword: item.keyword || existingData.douyinKeyword || '',
  douyinPublishedAt:
    formatLeadTimestamp(item.sourceCreatedAt) ||
    existingData.douyinPublishedAt ||
    '',
  funnelStageKey: existingData.funnelStageKey || 'new',
  funnelStageLabel: existingData.funnelStageLabel || LEAD_STATUS_LABELS.new,
});

const buildDealExtraData = (
  item: ILeadItem,
  customerId?: string,
  existingExtraData: Record<string, any> = {},
) => ({
  ...existingExtraData,
  externalLeadKey: existingExtraData.externalLeadKey || toLeadIdentity(item),
  leadSource: 'china_leads',
  source: 'douyin',
  sourceLabel: '抖音',
  channel: item.channel,
  customerId: customerId || existingExtraData.customerId || '',
  douyinCommentUserId:
    item.commentUserId || existingExtraData.douyinCommentUserId || '',
  commentNickname:
    item.commentNickname || existingExtraData.commentNickname || '',
  commentProfileUrl:
    item.commentProfileUrl || existingExtraData.commentProfileUrl || '',
  sourcePostUrl: item.sourcePostUrl || existingExtraData.sourcePostUrl || '',
  sourceCreatedAt:
    formatLeadTimestamp(item.sourceCreatedAt) ||
    existingExtraData.sourceCreatedAt ||
    '',
  keyword: item.keyword || existingExtraData.keyword || '',
  ipLocation: item.ipLocation || existingExtraData.ipLocation || '',
  funnelStageKey: existingExtraData.funnelStageKey || 'new',
  funnelStageLabel:
    existingExtraData.funnelStageLabel || LEAD_STATUS_LABELS.new,
  funnelModel: existingExtraData.funnelModel || FUNNEL_MODEL,
});

const ensureTag = async (
  subdomain: string,
  data: {
    name: string;
    type: string;
    colorCode?: string;
    parentId?: string;
    isGroup?: boolean;
    description?: string;
  },
) => {
  const existing = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'tags',
    action: 'findOne',
    input: {
      query: {
        name: data.name,
        type: data.type,
      },
    },
    defaultValue: null,
  }).catch(() => null);

  if (existing?._id) {
    return existing;
  }

  const created = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'mutation',
    module: 'tags',
    action: 'create',
    input: {
      data,
    },
    defaultValue: null,
  }).catch(async () => {
    return sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'tags',
      action: 'findOne',
      input: {
        query: {
          name: data.name,
          type: data.type,
        },
      },
      defaultValue: null,
    }).catch(() => null);
  });

  return created;
};

const ensureLeadTags = async (subdomain: string, item: ILeadItem) => {
  const group = await ensureTag(subdomain, {
    name: 'China Leads CRM',
    type: 'customer',
    isGroup: true,
    colorCode: '#2563eb',
    description: 'China Leads 自动创建的客户标签分组',
  });

  const tagSpecs = [
    {
      name: 'China Leads 来源 抖音',
      type: 'customer',
      colorCode: '#f97316',
      parentId: group?._id,
    },
    {
      name: 'China Leads 状态 待触达',
      type: 'customer',
      colorCode: '#7c3aed',
      parentId: group?._id,
    },
    item.keyword
      ? {
          name: normalizeTagName('China Leads 关键词', item.keyword),
          type: 'customer',
          colorCode: '#0f766e',
          parentId: group?._id,
        }
      : null,
  ].filter(Boolean) as Array<{
    name: string;
    type: string;
    colorCode?: string;
    parentId?: string;
  }>;

  const tags = await Promise.all(
    tagSpecs.map((tag) => ensureTag(subdomain, tag)),
  );

  return uniqueStrings(tags.map((tag) => tag?._id));
};

const findExistingCustomer = async (subdomain: string, item: ILeadItem) => {
  if (item.customerId) {
    const customer = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'customers',
      action: 'findOne',
      input: {
        query: {
          _id: item.customerId,
        },
      },
      defaultValue: null,
    }).catch(() => null);

    if (customer?._id) {
      return customer;
    }
  }

  const conditions: Record<string, any>[] = [];

  if (item.commentUserId) {
    conditions.push({ 'data.douyinCommentUserId': item.commentUserId });
  }

  if (item.commentProfileUrl) {
    conditions.push({ 'data.douyinProfileUrl': item.commentProfileUrl });
    conditions.push({ 'links.douyinProfile': item.commentProfileUrl });
  }

  if (!conditions.length) {
    return null;
  }

  const customers = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'customers',
    action: 'find',
    input: {
      query: {
        status: { $ne: 'deleted' },
        $or: conditions,
      },
    },
    defaultValue: [],
  }).catch(() => []);

  return customers?.[0] || null;
};

const upsertCustomerFromLead = async (
  subdomain: string,
  item: ILeadItem,
  assignedUserIds: string[],
  leadTagIds: string[],
) => {
  const existingCustomer = await findExistingCustomer(subdomain, item);
  const existingLinks = existingCustomer?.links || {};
  const nextTagIds = uniqueStrings([
    ...(existingCustomer?.tagIds || []),
    ...leadTagIds,
  ]);
  const ownerId = existingCustomer?.ownerId || assignedUserIds[0] || '';
  const customerDoc = {
    state: existingCustomer?.state === 'customer' ? 'customer' : 'lead',
    leadStatus: existingCustomer?.leadStatus || 'new',
    firstName: existingCustomer?.firstName || '',
    lastName: existingCustomer?.lastName || '',
    primaryPhone: existingCustomer?.primaryPhone || '',
    primaryEmail: existingCustomer?.primaryEmail || '',
    ownerId,
    description: existingCustomer?.description || DEFAULT_CUSTOMER_DESCRIPTION,
    tagIds: nextTagIds,
    links: {
      ...existingLinks,
      douyinProfile:
        item.commentProfileUrl || existingLinks.douyinProfile || '',
      douyinVideo: item.sourcePostUrl || existingLinks.douyinVideo || '',
    },
    data: buildCustomerData(item, existingCustomer?.data || {}),
  };

  const customer = existingCustomer?._id
    ? await sendTRPCMessage({
        subdomain,
        pluginName: 'core',
        method: 'mutation',
        module: 'customers',
        action: 'updateCustomer',
        input: {
          _id: existingCustomer._id,
          doc: customerDoc,
        },
      })
    : await sendTRPCMessage({
        subdomain,
        pluginName: 'core',
        method: 'mutation',
        module: 'customers',
        action: 'createCustomer',
        input: {
          doc: customerDoc,
        },
      });

  return {
    customer,
    action: existingCustomer?._id ? 'updated' : 'created',
  };
};

const findExistingDeal = async (
  subdomain: string,
  item: ILeadItem,
  customerId?: string,
) => {
  if (item.dealId) {
    const existingDeal = await sendTRPCMessage({
      subdomain,
      pluginName: 'sales',
      method: 'query',
      module: 'deal',
      action: 'findOne',
      input: {
        _id: item.dealId,
      },
      defaultValue: { data: null },
    }).catch(() => ({ data: null }));

    if (existingDeal?.data?._id) {
      return existingDeal.data;
    }
  }

  const conditions: Record<string, any>[] = [
    { 'extraData.externalLeadKey': toLeadIdentity(item) },
  ];

  if (customerId) {
    conditions.push({ 'extraData.customerId': customerId });
  }

  if (item.commentUserId) {
    conditions.push({ 'extraData.douyinCommentUserId': item.commentUserId });
  }

  if (item.commentProfileUrl) {
    conditions.push({ 'extraData.commentProfileUrl': item.commentProfileUrl });
  }

  if (item.sourcePostUrl) {
    conditions.push({ 'extraData.sourcePostUrl': item.sourcePostUrl });
  }

  const deals = await sendTRPCMessage({
    subdomain,
    pluginName: 'sales',
    method: 'query',
    module: 'deal',
    action: 'find',
    input: {
      query: {
        status: 'active',
        'extraData.source': 'douyin',
        $or: conditions,
      },
      limit: 1,
      sort: { updatedAt: -1 },
    },
    defaultValue: { data: [] },
  }).catch(() => ({ data: [] }));

  return deals?.data?.[0] || null;
};

const ensureCustomerDealRelation = async (
  subdomain: string,
  customerId?: string,
  dealId?: string,
) => {
  if (!customerId || !dealId) {
    return;
  }

  await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'mutation',
    module: 'relation',
    action: 'createMultipleRelations',
    input: {
      relations: [
        {
          entities: [
            { contentType: 'sales:deal', contentId: dealId },
            { contentType: 'core:customer', contentId: customerId },
          ],
        },
      ],
    },
    defaultValue: null,
  }).catch(() => null);
};

const getStageDetail = async (subdomain: string, stageId?: string) => {
  if (!stageId) {
    return null;
  }

  const response = await sendTRPCMessage({
    subdomain,
    pluginName: 'sales',
    method: 'query',
    module: 'stage',
    action: 'findOne',
    input: {
      _id: stageId,
    },
    defaultValue: { data: null },
  }).catch(() => ({ data: null }));

  return response?.data || null;
};

const getDealLink = async (subdomain: string, dealId?: string) => {
  if (!dealId) {
    return '';
  }

  const response = await sendTRPCMessage({
    subdomain,
    pluginName: 'sales',
    method: 'query',
    module: 'deal',
    action: 'getLink',
    input: {
      _id: dealId,
    },
    defaultValue: { data: '' },
  }).catch(() => ({ data: '' }));

  return response?.data || '';
};

const upsertDealFromLead = async (
  subdomain: string,
  item: ILeadItem,
  customerId: string | undefined,
  stageId: string | undefined,
  assignedUserIds: string[],
) => {
  const existingDeal = await findExistingDeal(subdomain, item, customerId);
  const nextAssignedUserIds = uniqueStrings([
    ...(existingDeal?.assignedUserIds || []),
    ...assignedUserIds,
  ]);
  const dealInput = {
    name:
      existingDeal?.name ||
      `[抖音线索] ${item.commentNickname || '匿名用户'} - ${
        item.keyword || item.channel
      }`,
    customerIds: customerId ? [customerId] : [],
    assignedUserIds: nextAssignedUserIds,
    description: existingDeal?.description || buildLeadDescription(item),
    extraData: buildDealExtraData(
      item,
      customerId,
      existingDeal?.extraData || {},
    ),
  };

  let dealId = existingDeal?._id;
  let action: 'created' | 'updated' | undefined;
  let effectiveStageId = existingDeal?.stageId || stageId;

  if (!existingDeal && stageId) {
    const createdDeal = await sendTRPCMessage({
      subdomain,
      pluginName: 'sales',
      method: 'mutation',
      module: 'deal',
      action: 'create',
      input: {
        ...dealInput,
        stageId,
      },
    }).catch(() => null);

    dealId = createdDeal?.data?._id;
    effectiveStageId = createdDeal?.data?.stageId || stageId;
    action = dealId ? 'created' : undefined;
  }

  if (existingDeal?._id) {
    await sendTRPCMessage({
      subdomain,
      pluginName: 'sales',
      method: 'mutation',
      module: 'deal',
      action: 'updateOne',
      input: {
        selector: { _id: existingDeal._id },
        modifier: {
          assignedUserIds: nextAssignedUserIds,
          description: dealInput.description,
          extraData: dealInput.extraData,
          name: dealInput.name,
        },
      },
    }).catch(() => null);
    action = 'updated';
  }

  await ensureCustomerDealRelation(subdomain, customerId, dealId);

  const stage = await getStageDetail(subdomain, effectiveStageId);
  const dealLink = await getDealLink(subdomain, dealId);

  return {
    dealId,
    dealLink,
    dealStageId: stage?._id || effectiveStageId || '',
    dealStageName: stage?.name || '',
    action,
  };
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
  const items = await models.ChinaLeadItems.find({
    jobId,
    syncStatus: 'pending',
  })
    .sort({ createdAt: 1 })
    .lean();

  const result: ISyncResult = {
    jobId,
    total: items.length,
    synced: 0,
    skipped: 0,
    failed: 0,
    createdCustomers: 0,
    updatedCustomers: 0,
    createdDeals: 0,
    updatedDeals: 0,
    customerIds: [],
    dealIds: [],
  };

  const { stageId } = await resolveSalesStage(subdomain);
  const assignedUserIds = parseIdList(
    process.env.CHINA_LEADS_ASSIGNED_USER_IDS,
  );

  for (const item of items) {
    try {
      if (!item.commentNickname && !item.commentUserId && !item.commentText) {
        await models.ChinaLeadItems.updateOne(
          { _id: item._id },
          {
            $set: { syncStatus: 'skipped', syncError: 'Missing lead content' },
          },
        );
        result.skipped += 1;
        continue;
      }

      const leadTagIds = await ensureLeadTags(subdomain, item);
      const { customer, action: customerSyncAction } =
        await upsertCustomerFromLead(
          subdomain,
          item,
          assignedUserIds,
          leadTagIds,
        );

      const customerId = customer?._id;
      const customerLink = getCustomerLink(customerId);
      const customerOwnerId = customer?.ownerId || assignedUserIds[0] || '';
      const customerTagIds = uniqueStrings(customer?.tagIds || leadTagIds);
      const funnelStageKey =
        customer?.data?.funnelStageKey || customer?.leadStatus || 'new';
      const funnelStageLabel =
        customer?.data?.funnelStageLabel ||
        LEAD_STATUS_LABELS[customer?.leadStatus || 'new'] ||
        LEAD_STATUS_LABELS.new;

      const dealInfo = customerId
        ? await upsertDealFromLead(
            subdomain,
            item,
            customerId,
            stageId,
            assignedUserIds,
          )
        : {
            dealId: '',
            dealLink: '',
            dealStageId: '',
            dealStageName: '',
            action: undefined,
          };

      const dealId = dealInfo.dealId;

      await models.ChinaLeadItems.updateOne(
        { _id: item._id },
        {
          $set: {
            syncStatus: 'synced',
            syncError: '',
            customerId,
            customerLink,
            customerOwnerId,
            customerTagIds,
            customerSyncAction,
            dealId,
            dealLink: dealInfo.dealLink,
            dealStageId: dealInfo.dealStageId,
            dealStageName: dealInfo.dealStageName,
            dealSyncAction: dealInfo.action,
            funnelStageKey,
            funnelStageLabel,
            updatedAt: new Date(),
          },
        },
      );

      result.synced += 1;
      if (customerSyncAction === 'created') {
        result.createdCustomers += 1;
      }
      if (customerSyncAction === 'updated') {
        result.updatedCustomers += 1;
      }
      if (dealInfo.action === 'created') {
        result.createdDeals += 1;
      }
      if (dealInfo.action === 'updated') {
        result.updatedDeals += 1;
      }
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
