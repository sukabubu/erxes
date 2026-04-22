import { IconBrandTiktok, IconFilterBolt } from '@tabler/icons-react';
import { Suspense, lazy } from 'react';
import { IUIConfig } from 'erxes-ui';

const ChinaLeadsNavigation = lazy(() =>
  import('./modules/ChinaLeadsNavigation').then((module) => ({
    default: module.ChinaLeadsNavigation,
  })),
);

const ChinaLeadsSettingsNavigation = lazy(() =>
  import('./modules/ChinaLeadsSettingsNavigation').then((module) => ({
    default: module.ChinaLeadsSettingsNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'china_leads',
  path: 'china-leads',
  settingsNavigation: () => (
    <Suspense fallback={<div />}>
      <ChinaLeadsSettingsNavigation />
    </Suspense>
  ),
  navigationGroup: {
    name: 'china_leads',
    icon: IconBrandTiktok,
    content: () => (
      <Suspense fallback={<div />}>
        <ChinaLeadsNavigation />
      </Suspense>
    ),
  },
  modules: [
    {
      name: 'chinaLeads',
      icon: IconBrandTiktok,
      path: 'china-leads',
    },
    {
      name: 'ruleSets',
      icon: IconFilterBolt,
      path: 'china-leads/rules',
    },
  ],
};
