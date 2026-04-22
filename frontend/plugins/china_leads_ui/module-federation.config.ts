import { ModuleFederationConfig } from '@nx/rspack/module-federation';

const coreLibraries = new Set([
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  'erxes-ui',
  '@apollo/client',
  'jotai',
  'ui-modules',
  'react-i18next',
]);

const config: ModuleFederationConfig = {
  name: 'china_leads_ui',
  exposes: {
    './config': './src/config.tsx',
    './china-leads': './src/modules/ChinaLeadsMain.tsx',
    './chinaLeadsSettings': './src/pages/ChinaLeadsSettingsPage.tsx',
  },
  shared: (libraryName, defaultConfig) => {
    if (coreLibraries.has(libraryName)) {
      return defaultConfig;
    }

    return false;
  },
};

export default config;
