import { CallQueueRecordTable } from '@/integrations/call/components/CallQueueRecordTable';
import { IconPhone } from '@tabler/icons-react';
import { Breadcrumb, Button, PageContainer } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';

export const CallIndexPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/frontline/calls/dashboard">
                    <IconPhone />
                    队列总机台
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/frontline/calls/statistics">
                    <IconPhone />
                    队列统计
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
      </PageHeader>
      <CallQueueRecordTable />
    </PageContainer>
  );
};
