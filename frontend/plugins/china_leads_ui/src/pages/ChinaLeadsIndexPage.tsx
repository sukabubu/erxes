import { useMutation, useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import { Button, Input, PageContainer, Textarea, toast } from 'erxes-ui';
import { RUN_CHINA_LEAD_JOB, SYNC_CHINA_LEAD_JOB } from '~/graphql/mutations';
import { GET_CHINA_LEAD_ITEMS, GET_CHINA_LEAD_JOBS } from '~/graphql/queries';
import { TChinaLeadItem, TChinaLeadJob } from '~/types';

const toLines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const toNumber = (value: string, fallback: number) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0
    ? numberValue
    : fallback;
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '未提供';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '未提供' : date.toLocaleString();
};

export const ChinaLeadsIndexPage = () => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState('跨境电商\ntiktok跨境');
  const [executorBaseUrl, setExecutorBaseUrl] = useState('http://127.0.0.1:4318');
  const [target, setTarget] = useState('50');
  const [pages, setPages] = useState('2');
  const [count, setCount] = useState('20');
  const [scrollLoops, setScrollLoops] = useState('4');
  const [searchTimeoutMs, setSearchTimeoutMs] = useState('300000');
  const [filterTimeoutMs, setFilterTimeoutMs] = useState('300000');

  const { data, loading } = useQuery<{ chinaLeadJobs: TChinaLeadJob[] }>(
    GET_CHINA_LEAD_JOBS,
    {
      pollInterval: 5000,
    },
  );

  const jobs = data?.chinaLeadJobs || [];
  const selectedJob = useMemo(
    () => jobs.find((job) => job._id === selectedJobId) || jobs[0],
    [jobs, selectedJobId],
  );

  const { data: itemsData, loading: itemsLoading } = useQuery<{
    chinaLeadItems: TChinaLeadItem[];
  }>(GET_CHINA_LEAD_ITEMS, {
    variables: { jobId: selectedJob?._id || '' },
    skip: !selectedJob?._id,
  });
  const collectedItems = itemsData?.chinaLeadItems || [];
  const importedItems = collectedItems.filter(
    (item) => item.syncStatus !== 'pending' || item.customerId || item.dealId,
  );
  const syncedCount = collectedItems.filter((item) => item.syncStatus === 'synced').length;
  const failedCount = collectedItems.filter((item) => item.syncStatus === 'failed').length;

  const [runJob, { loading: running }] = useMutation(RUN_CHINA_LEAD_JOB, {
    refetchQueries: [{ query: GET_CHINA_LEAD_JOBS }],
    awaitRefetchQueries: true,
  });

  const [syncJob, { loading: syncing }] = useMutation(SYNC_CHINA_LEAD_JOB, {
    refetchQueries: [
      { query: GET_CHINA_LEAD_JOBS },
      ...(selectedJob?._id
        ? [{ query: GET_CHINA_LEAD_ITEMS, variables: { jobId: selectedJob._id } }]
        : []),
    ],
    awaitRefetchQueries: true,
  });

  const handleNewJob = async () => {
    try {
      const response = await runJob({
        variables: {
          doc: {
            name: `临时任务 ${new Date().toLocaleString()}`,
            channel: 'douyin',
            executorBaseUrl,
            cookie: '',
            keywords: toLines(keywords),
            days: 1,
            target: toNumber(target, 50),
            pages: toNumber(pages, 2),
            count: toNumber(count, 20),
            scrollLoops: toNumber(scrollLoops, 4),
            searchTimeoutMs: toNumber(searchTimeoutMs, 300000),
            filterTimeoutMs: toNumber(filterTimeoutMs, 300000),
            extraNameExcludes: [],
            extraCommentExcludes: [],
            positiveKeywords: [],
            scoreRules: [],
          },
        },
      });

      const jobId = response.data?.chinaLeadJobsRun?._id;
      if (jobId) {
        setSelectedJobId(jobId);
      }

      toast({ title: '任务已发起', variant: 'default' });
    } catch (error) {
      toast({
        title: '发起任务失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSync = async () => {
    if (!selectedJob?._id) {
      return;
    }

    try {
      await syncJob({ variables: { _id: selectedJob._id } });
      toast({ title: '同步已执行', variant: 'default' });
    } catch (error) {
      toast({
        title: '同步失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 p-6 w-full overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">China Leads</h1>
            <p className="text-sm text-muted-foreground">
              管理抖音/小红书评论线索任务、查看执行结果，并同步到 erxes 销售漏斗。
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSync} disabled={syncing || !selectedJob?._id}>
              导入销售漏斗
            </Button>
            <Button onClick={handleNewJob} disabled={running}>New Job</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border p-4">
            <div className="text-sm text-muted-foreground">阶段 1</div>
            <div className="mt-2 font-medium">规则集可配置</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm text-muted-foreground">阶段 2</div>
            <div className="mt-2 font-medium">任务执行与结果入库</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm text-muted-foreground">阶段 3</div>
            <div className="mt-2 font-medium">同步 Contacts / Deals</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
          <div className="rounded-md border p-4 flex flex-col gap-4">
            <div>
              <div className="font-medium">快速任务</div>
              <div className="text-sm text-muted-foreground mt-1">
                直接输入关键词发起一次评论采集任务。
              </div>
            </div>

            <Textarea rows={6} value={keywords} onChange={(event) => setKeywords(event.currentTarget.value)} />
            <Textarea rows={2} value={executorBaseUrl} onChange={(event) => setExecutorBaseUrl(event.currentTarget.value)} />

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">目标线索数</label>
                <Input value={target} onChange={(event) => setTarget(event.currentTarget.value)} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">每视频评论数</label>
                <Input value={count} onChange={(event) => setCount(event.currentTarget.value)} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">评论页数</label>
                <Input value={pages} onChange={(event) => setPages(event.currentTarget.value)} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">搜索滚动次数</label>
                <Input value={scrollLoops} onChange={(event) => setScrollLoops(event.currentTarget.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">搜索超时(ms)</label>
                <Input value={searchTimeoutMs} onChange={(event) => setSearchTimeoutMs(event.currentTarget.value)} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">过滤超时(ms)</label>
                <Input value={filterTimeoutMs} onChange={(event) => setFilterTimeoutMs(event.currentTarget.value)} />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="font-medium mb-3">任务列表</div>
              <div className="grid gap-2">
                {loading && <div className="text-sm text-muted-foreground">加载中...</div>}
                {!loading && !jobs.length && (
                  <div className="text-sm text-muted-foreground">暂无任务</div>
                )}
                {jobs.map((job) => (
                  <button
                    key={job._id}
                    className={`text-left rounded border p-3 ${selectedJob?._id === job._id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedJobId(job._id)}
                    type="button"
                  >
                    <div className="font-medium">{job.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {job.channel} · {job.status}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-md border p-4 flex flex-col gap-4">
            <div>
              <div className="font-medium">任务详情</div>
              <div className="text-sm text-muted-foreground mt-1">
                {selectedJob ? `${selectedJob.name} · ${selectedJob.status}` : '选择一个任务查看结果'}
              </div>
            </div>

            {selectedJob?.errorMessage && (
              <div className="rounded border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {selectedJob.errorMessage}
              </div>
            )}

            <div className="grid gap-2">
              {selectedJob && (
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded border p-3">
                    <div className="text-xs text-muted-foreground">采集条数</div>
                    <div className="mt-1 text-lg font-semibold">{collectedItems.length}</div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-xs text-muted-foreground">已导入</div>
                    <div className="mt-1 text-lg font-semibold">{syncedCount}</div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-xs text-muted-foreground">导入失败</div>
                    <div className="mt-1 text-lg font-semibold">{failedCount}</div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-xs text-muted-foreground">任务时间</div>
                    <div className="mt-1 text-sm">
                      {formatDateTime(selectedJob.startedAt)}
                    </div>
                  </div>
                </div>
              )}

              {itemsLoading && selectedJob && (
                <div className="text-sm text-muted-foreground">加载任务结果...</div>
              )}

              {!itemsLoading && !collectedItems.length && (
                <div className="text-sm text-muted-foreground">暂无线索结果</div>
              )}

              {!!collectedItems.length && (
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="grid gap-3">
                    <div>
                      <div className="font-medium">采集到的抖音线索</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        可直接查看视频、发布时间、评论内容和抖音主页。
                      </div>
                    </div>

                    {collectedItems.slice(0, 20).map((item) => (
                      <div key={item._id} className="rounded border p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium">{item.commentNickname || '匿名用户'}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {item.keyword || item.channel} · {item.ipLocation || '未知地区'}
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>score {item.score || 0}</div>
                            <div>{item.syncStatus}</div>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                          <div>发布时间: {formatDateTime(item.sourceCreatedAt)}</div>
                          <div>视频作者: {item.sourceAuthor || '未提供'}</div>
                        </div>

                        <div className="text-sm mt-3 whitespace-pre-wrap">{item.commentText || '-'}</div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.sourcePostUrl && (
                            <a
                              className="inline-flex items-center rounded border px-3 py-1.5 text-sm"
                              href={item.sourcePostUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              查看视频
                            </a>
                          )}
                          {item.commentProfileUrl && (
                            <a
                              className="inline-flex items-center rounded border px-3 py-1.5 text-sm"
                              href={item.commentProfileUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              查看主页
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <div className="font-medium">已导入销售漏斗</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        导入后只保留抖音线索信息，姓名、微信、电话等由销售后续补全并推进漏斗。
                      </div>
                    </div>

                    {!importedItems.length && (
                      <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
                        还没有导入结果。点击上方“导入销售漏斗”后，会在这里看到 customer/deal 关联结果。
                      </div>
                    )}

                    {importedItems.slice(0, 20).map((item) => (
                      <div key={`import-${item._id}`} className="rounded border p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-medium">{item.commentNickname || '匿名线索'}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              来源抖音 · {item.keyword || item.channel}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{item.syncStatus}</div>
                        </div>

                        <div className="mt-3 grid gap-1 text-sm">
                          <div>Customer ID: {item.customerId || '待生成'}</div>
                          <div>Deal ID: {item.dealId || '待生成'}</div>
                          {item.syncError && (
                            <div className="text-destructive">失败原因: {item.syncError}</div>
                          )}
                        </div>

                        <div className="mt-3 rounded bg-muted/40 p-3 text-sm text-muted-foreground">
                          跟进路径建议: 抖音触达 -> 转微信 -> 电话沟通 -> 线下拜访 -> 成交
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
