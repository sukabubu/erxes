import { IconClipboard, IconUserFilled } from '@tabler/icons-react';
import { NavigationMenuLinkItem } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';

export const MainNavigation = () => {
  const { isLoaded, hasModulePermission, isWildcard } = usePermissionCheck();

  const showProjects =
    !isLoaded || isWildcard || hasModulePermission('project');
  const showTasks = !isLoaded || isWildcard || hasModulePermission('task');

  return (
    <>
      {showProjects && (
        <NavigationMenuLinkItem
          name="项目"
          icon={IconClipboard}
          pathPrefix="operation"
          path="projects"
        />
      )}
      {showTasks && (
        <NavigationMenuLinkItem
          name="我的任务"
          icon={IconUserFilled}
          pathPrefix="operation"
          path="tasks"
        />
      )}
    </>
  );
};
