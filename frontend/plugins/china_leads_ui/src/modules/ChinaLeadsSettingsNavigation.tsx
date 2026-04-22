import { SettingsNavigationMenuLinkItem, Sidebar } from 'erxes-ui';

export const ChinaLeadsSettingsNavigation = () => {
  return (
    <Sidebar.Group>
      <Sidebar.GroupLabel className="h-4">China Leads</Sidebar.GroupLabel>
      <Sidebar.GroupContent className="pt-1">
        <Sidebar.Menu>
          <SettingsNavigationMenuLinkItem
            pathPrefix="china-leads"
            path="rules"
            name="Rule Sets"
          />
          <SettingsNavigationMenuLinkItem
            pathPrefix="china-leads"
            path="jobs"
            name="Jobs"
          />
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
};
