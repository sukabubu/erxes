import { IntegrationList } from '@/integrations/components/IntegrationList';
import { ScrollArea } from 'erxes-ui';

export const IntegrationSettingsPage = () => {
  return (
    <ScrollArea>
      <div className="h-full w-full mx-auto max-w-3xl px-8 py-5 flex flex-col gap-8">
        <div className="flex flex-col gap-2 px-1">
          <h1 className="text-lg font-semibold">集成</h1>
          <span className="font-normal text-muted-foreground text-sm">
            配置你的集成并开始与客户建立连接
          </span>
        </div>
        <IntegrationList />
      </div>
    </ScrollArea>
  );
};
