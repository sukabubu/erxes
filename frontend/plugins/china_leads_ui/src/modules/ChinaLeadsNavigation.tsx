import { IconBrandTiktok, IconListDetails, IconFilterBolt } from '@tabler/icons-react';
import { NavigationMenuLinkItem } from 'erxes-ui';

export const ChinaLeadsNavigation = () => {
  return (
    <>
      <NavigationMenuLinkItem
        name="China Leads"
        icon={IconBrandTiktok}
        path="china-leads"
      />
      <NavigationMenuLinkItem
        name="Jobs"
        icon={IconListDetails}
        path="china-leads/jobs"
      />
      <NavigationMenuLinkItem
        name="Rule Sets"
        icon={IconFilterBolt}
        path="china-leads/rules"
      />
    </>
  );
};
