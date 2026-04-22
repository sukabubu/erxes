import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';

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
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/jobs" element={<IndexPage />} />
        <Route path="/rules" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
};

export default ChinaLeadsMain;
