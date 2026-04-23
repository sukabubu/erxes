import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import { Button, Input, PageContainer, Textarea, toast } from 'erxes-ui';
import { ADD_CHINA_LEAD_RULE_SET, RUN_CHINA_LEAD_JOB } from '~/graphql/mutations';
import { GET_CHINA_LEAD_JOBS, GET_CHINA_LEAD_RULE_SETS } from '~/graphql/queries';
import { TChinaLeadRuleSet } from '~/types';

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

export const ChinaLeadsSettingsPage = () => {
  const [name, setName] = useState('跨境评论线索');
  const [executorBaseUrl, setExecutorBaseUrl] = useState('http://127.0.0.1:4318');
  const [keywords, setKeywords] = useState('跨境电商\ntiktok跨境\n外贸');
  const [nameExcludes, setNameExcludes] = useState('服务商\n货代\n海外仓');
  const [commentExcludes, setCommentExcludes] = useState('服务商\n陪跑\n招商');
  const [positiveKeywords, setPositiveKeywords] = useState('怎么做\n想了解\n联系方式');
  const [target, setTarget] = useState('100');
  const [pages, setPages] = useState('2');
  const [count, setCount] = useState('50');
  const [scrollLoops, setScrollLoops] = useState('28');
  const [searchTimeoutMs, setSearchTimeoutMs] = useState('300000');
  const [filterTimeoutMs, setFilterTimeoutMs] = useState('300000');

  const { data, loading } = useQuery<{ chinaLeadRuleSets: TChinaLeadRuleSet[] }>(
    GET_CHINA_LEAD_RULE_SETS,
  );

  const [addRuleSet, { loading: saving }] = useMutation(ADD_CHINA_LEAD_RULE_SET, {
    refetchQueries: [{ query: GET_CHINA_LEAD_RULE_SETS }],
    awaitRefetchQueries: true,
  });

  const [runJob, { loading: running }] = useMutation(RUN_CHINA_LEAD_JOB, {
    refetchQueries: [{ query: GET_CHINA_LEAD_JOBS }],
    awaitRefetchQueries: true,
  });

  const handleSave = async () => {
    try {
      await addRuleSet({
        variables: {
          doc: {
            name,
            description: '通过 china_leads 插件维护的评论线索规则集',
            channel: 'douyin',
            executorBaseUrl,
            keywords: toLines(keywords),
            days: 1,
            target: toNumber(target, 100),
            pages: toNumber(pages, 2),
            count: toNumber(count, 50),
            scrollLoops: toNumber(scrollLoops, 28),
            searchTimeoutMs: toNumber(searchTimeoutMs, 300000),
            filterTimeoutMs: toNumber(filterTimeoutMs, 300000),
            extraNameExcludes: toLines(nameExcludes),
            extraCommentExcludes: toLines(commentExcludes),
            positiveKeywords: toLines(positiveKeywords),
            autoSync: false,
            isActive: true,
            scoreRules: [],
          },
        },
      });

      toast({ title: '规则集已保存', variant: 'default' });
    } catch (error) {
      toast({
        title: '保存失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRun = async () => {
    try {
      await runJob({
        variables: {
          doc: {
            name: `${name} ${new Date().toLocaleString()}`,
            channel: 'douyin',
            executorBaseUrl,
            cookie: '',
            keywords: toLines(keywords),
            days: 1,
            target: toNumber(target, 100),
            pages: toNumber(pages, 2),
            count: toNumber(count, 50),
            scrollLoops: toNumber(scrollLoops, 28),
            searchTimeoutMs: toNumber(searchTimeoutMs, 300000),
            filterTimeoutMs: toNumber(filterTimeoutMs, 300000),
            extraNameExcludes: toLines(nameExcludes),
            extraCommentExcludes: toLines(commentExcludes),
            positiveKeywords: toLines(positiveKeywords),
            scoreRules: [],
          },
        },
      });

      toast({ title: '任务已发起', variant: 'default' });
    } catch (error) {
      toast({
        title: '发起任务失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <PageContainer className="flex-row">
      <div className="flex flex-col flex-1 p-6 gap-6 overflow-auto">
        <div>
          <h1 className="text-2xl font-semibold">Rule Sets</h1>
          <p className="text-sm text-muted-foreground">
            配置关键词、排除词、评分规则，以及任务默认参数。
          </p>
        </div>

        <div className="grid gap-4 max-w-3xl">
          <div className="grid gap-2">
            <label className="text-sm font-medium">规则名称</label>
            <Input value={name} onChange={(event) => setName(event.currentTarget.value)} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">关键词</label>
            <Textarea value={keywords} onChange={(event) => setKeywords(event.currentTarget.value)} rows={6} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">执行器地址</label>
            <Input value={executorBaseUrl} onChange={(event) => setExecutorBaseUrl(event.currentTarget.value)} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">采集规模</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-xs font-medium text-muted-foreground">目标线索数</label>
                <Input value={target} onChange={(event) => setTarget(event.currentTarget.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium text-muted-foreground">每视频评论数</label>
                <Input value={count} onChange={(event) => setCount(event.currentTarget.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium text-muted-foreground">评论页数</label>
                <Input value={pages} onChange={(event) => setPages(event.currentTarget.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium text-muted-foreground">搜索滚动次数</label>
                <Input value={scrollLoops} onChange={(event) => setScrollLoops(event.currentTarget.value)} />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">昵称排除词</label>
            <Textarea value={nameExcludes} onChange={(event) => setNameExcludes(event.currentTarget.value)} rows={5} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">评论排除词</label>
            <Textarea value={commentExcludes} onChange={(event) => setCommentExcludes(event.currentTarget.value)} rows={6} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">正向命中词</label>
            <Textarea value={positiveKeywords} onChange={(event) => setPositiveKeywords(event.currentTarget.value)} rows={5} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">搜索超时(ms)</label>
              <Input value={searchTimeoutMs} onChange={(event) => setSearchTimeoutMs(event.currentTarget.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">过滤超时(ms)</label>
              <Input value={filterTimeoutMs} onChange={(event) => setFilterTimeoutMs(event.currentTarget.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>Save Rule Set</Button>
            <Button variant="secondary" onClick={handleRun} disabled={running}>
              Run From Template
            </Button>
          </div>

          <div className="rounded-md border p-4">
            <div className="text-sm font-medium mb-3">已保存规则</div>
            <div className="grid gap-3">
              {loading && <div className="text-sm text-muted-foreground">加载中...</div>}
              {!loading && !data?.chinaLeadRuleSets?.length && (
                <div className="text-sm text-muted-foreground">暂无规则集</div>
              )}
              {data?.chinaLeadRuleSets?.map((ruleSet) => (
                <div key={ruleSet._id} className="rounded border p-3">
                  <div className="font-medium">{ruleSet.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {ruleSet.channel} · 目标 {ruleSet.target} 条 · {ruleSet.keywords.length} 个关键词 · {ruleSet.extraCommentExcludes.length} 个评论排除词
                  </div>
                  {ruleSet.executorBaseUrl && (
                    <div className="text-xs text-muted-foreground mt-1">{ruleSet.executorBaseUrl}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
