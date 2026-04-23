import { Suspense, lazy } from 'react';

const IndexPage = lazy(() =>
  import('~/pages/ChinaLeadsIndexPage').then((module) => ({
    default: module.ChinaLeadsIndexPage,
  })),
);

const SettingsPage = lazy(() =>
  import('~/pages/ChinaLeadsSettingsPage').then((module) => ({
    default: module.ChinaLeadsSettingsPage,
  })),
);

const ChinaLeadsMain = () => {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '/china-leads';
  const isRuleSetPage = pathname.includes('/china-leads/rules');
  const ActivePage = isRuleSetPage ? SettingsPage : IndexPage;

  return (
    <Suspense fallback={<div />}>
      <ActivePage />
    </Suspense>
  );
};

export default ChinaLeadsMain;
