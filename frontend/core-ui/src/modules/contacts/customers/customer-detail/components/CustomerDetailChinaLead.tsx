import { useCustomerDetailWithQuery } from '../../hooks/useCustomerDetailWithQuery';

const getString = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const displayValue = (value: unknown, empty = '未提供') => {
  const normalized = getString(value);

  return normalized || empty;
};

const displayDateTime = (value: unknown) => {
  const normalized = getString(value);

  if (!normalized) {
    return '未提供';
  }

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? normalized : date.toLocaleString();
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="grid gap-1">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="text-sm break-all">{value}</div>
  </div>
);

export const CustomerDetailChinaLead = () => {
  const { customerDetail } = useCustomerDetailWithQuery();
  const data = (customerDetail?.data || {}) as Record<string, unknown>;
  const links = (customerDetail?.links || {}) as Record<string, unknown>;

  const sourceLabel = getString(data.sourceLabel);
  const nickname = getString(data.douyinNickname);
  const profileUrl =
    getString(data.douyinProfileUrl) || getString(links.douyinProfile);
  const videoUrl =
    getString(data.douyinVideoUrl) || getString(links.douyinVideo);
  const commentText = getString(data.douyinCommentText);
  const publishedAt = getString(data.douyinPublishedAt);
  const keyword = getString(data.douyinKeyword);
  const hasChinaLeadData = Boolean(
    sourceLabel || nickname || profileUrl || videoUrl || commentText || keyword,
  );

  if (!hasChinaLeadData) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card px-4 py-4">
      <div className="font-medium">抖音线索信息</div>
      <div className="mt-1 text-sm text-muted-foreground">
        这部分是系统从抖音采集后自动写入联系人，真实姓名、手机号、邮箱、微信号仍由销售后续补充。
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InfoRow label="来源" value={displayValue(sourceLabel || '抖音')} />
        <InfoRow label="抖音昵称" value={displayValue(nickname)} />
        <InfoRow label="关键词" value={displayValue(keyword)} />
        <InfoRow label="视频发布时间" value={displayDateTime(publishedAt)} />
      </div>

      <div className="mt-4 grid gap-4">
        <InfoRow label="评论内容" value={displayValue(commentText)} />
        <InfoRow label="抖音主页" value={displayValue(profileUrl)} />
        <InfoRow label="视频链接" value={displayValue(videoUrl)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {profileUrl && (
          <a
            className="inline-flex items-center rounded border px-3 py-1.5 text-sm"
            href={profileUrl}
            rel="noreferrer"
            target="_blank"
          >
            打开抖音主页
          </a>
        )}
        {videoUrl && (
          <a
            className="inline-flex items-center rounded border px-3 py-1.5 text-sm"
            href={videoUrl}
            rel="noreferrer"
            target="_blank"
          >
            打开视频
          </a>
        )}
      </div>

      <div className="mt-4 rounded-md bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
        待销售补充: 真实姓名 / 手机号 / 邮箱 / 微信号
      </div>
    </div>
  );
};
