import { useMutation, useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import { Button, PageContainer, Textarea, toast } from 'erxes-ui';
import { RUN_CHINA_LEAD_JOB, SYNC_CHINA_LEAD_JOB } from '~/graphql/mutations';
import { GET_CHINA_LEAD_ITEMS, GET_CHINA_LEAD_JOBS } from '~/graphql/queries';
import { TChinaLeadItem, TChinaLeadJob } from '~/types';

export const ChinaLeadsIndexPage = () => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState('跨境电商\ntiktok跨境');

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
            executorBaseUrl: '',
            cookie: '',
            keywords: keywords.split('\n').map((item) => item.trim()).filter(Boolean),
            days: 1,
            target: 50,
            pages: 2,
            count: 20,
            scrollLoops: 10,
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
              管理抖音/小红书评论线索任务、查看执行结果，并同步到 erxes。
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSync} disabled={syncing || !selectedJob?._id}>
              Sync To erxes
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
              {itemsLoading && selectedJob && (
                <div className="text-sm text-muted-foreground">加载任务结果...</div>
              )}
              {!itemsLoading && !itemsData?.chinaLeadItems?.length && (
                <div className="text-sm text-muted-foreground">暂无线索结果</div>
              )}
              {itemsData?.chinaLeadItems?.slice(0, 20).map((item) => (
                <div key={item._id} className="rounded border p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-medium">{item.commentNickname || '匿名用户'}</div>
                    <div className="text-xs text-muted-foreground">
                      score {item.score || 0} · {item.syncStatus}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.keyword || item.channel} · {item.ipLocation || '未知地区'}
                  </div>
                  <div className="text-sm mt-2 whitespace-pre-wrap">{item.commentText || '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
