import {
  IconAlertSquareRounded,
  IconProgressCheck,
  IconSearch,
  IconUsers,
} from '@tabler/icons-react';
import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';

import { ProjectHotKeyScope } from '@/project/constants/ProjectHotKeyScope';
import { ProjectsTotalCount } from '@/project/components/ProjectsTotalCount';
import { SelectLead } from '@/project/components/select/SelectLead';
import { SelectStatus } from '@/operation/components/SelectStatus';
import { useParams } from 'react-router-dom';
import { PROJECTS_CURSOR_SESSION_KEY } from '@/project/constants/ProjectSessionKey';
import { SelectTeam } from '@/team/components/SelectTeam';
import { SelectPriority } from '@/operation/components/SelectPriority';
import { TagsFilter } from 'ui-modules';

const ProjectsFilterPopover = () => {
  const { teamId } = useParams();

  const [queries] = useMultiQueryState<{
    name: string;
    lead: string;
    team: string[];
    priority: string;
    status: string;
    tags: string[];
  }>(['name', 'lead', 'team', 'priority', 'status', 'tags']);

  const hasFilters = Object.values(queries || {}).some(
    (value) => value !== null,
  );

  return (
    <>
      <Filter.Popover scope={ProjectHotKeyScope.ProjectsPage}>
        <Filter.Trigger isFiltered={hasFilters} />
        <Combobox.Content>
          <Filter.View>
            <Command>
              <Filter.CommandInput
                placeholder="筛选"
                variant="secondary"
                className="bg-background"
              />
              <Command.List className="p-1">
                <Filter.Item value="name" inDialog>
                  <IconSearch />
                  搜索
                </Filter.Item>
                <Command.Separator className="my-1" />
                <SelectLead.FilterItem />
                {!teamId && (
                  <Filter.Item value="team">
                    <IconUsers />
                    团队
                  </Filter.Item>
                )}
                <Filter.Item value="priority">
                  <IconAlertSquareRounded />
                  优先级
                </Filter.Item>
                <Filter.Item value="status">
                  <IconProgressCheck />
                  状态
                </Filter.Item>
                <TagsFilter />
              </Command.List>
            </Command>
          </Filter.View>
          <SelectLead.FilterView />
          {!teamId && <SelectTeam.FilterView />}
          <SelectPriority.FilterView />
          <SelectStatus.FilterView />
          <TagsFilter.View tagType="operation:project" />
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="name" inDialog>
          <Filter.DialogStringView filterKey="name" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const ProjectsFilter = () => {
  const { teamId } = useParams();

  const [queries] = useMultiQueryState<{
    name: string;
    lead: string;
    team: string[];
    priority: string;
    status: string;
    tags: string[];
  }>(['name', 'lead', 'team', 'priority', 'status', 'tags']);
  const { name } = queries || {};

  return (
    <Filter id="Projects-filter" sessionKey={PROJECTS_CURSOR_SESSION_KEY}>
      <Filter.Bar>
        {name && (
          <Filter.BarItem queryKey="name">
            <Filter.BarName>
              <IconSearch />
              搜索
            </Filter.BarName>
            <Filter.BarButton filterKey="name" inDialog>
              {name}
            </Filter.BarButton>
          </Filter.BarItem>
        )}
        <SelectLead.FilterBar />
        {!teamId && (
          <Filter.BarItem queryKey="team">
            <Filter.BarName>
              <IconUsers />
              团队
            </Filter.BarName>
            <SelectTeam.FilterBar />
          </Filter.BarItem>
        )}
        <Filter.BarItem queryKey="priority">
          <Filter.BarName>
            <IconAlertSquareRounded />
            优先级
          </Filter.BarName>
          <SelectPriority.FilterBar />
        </Filter.BarItem>
        <Filter.BarItem queryKey="status">
          <Filter.BarName>
            <IconProgressCheck />
            状态
          </Filter.BarName>
          <SelectStatus.FilterBar />
        </Filter.BarItem>
        <TagsFilter.Bar tagType="operation:project" />
        <ProjectsFilterPopover />
        <ProjectsTotalCount />
      </Filter.Bar>
    </Filter>
  );
};
