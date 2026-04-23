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
    './china_leads': './src/modules/ChinaLeadsMain.tsx',
    './chinaLeads': './src/modules/ChinaLeadsMain.tsx',
    './china-leads': './src/modules/ChinaLeadsMain.tsx',
    './ruleSets': './src/pages/ChinaLeadsSettingsPage.tsx',
    './china_leadsSettings': './src/pages/ChinaLeadsSettingsPage.tsx',
    './chinaLeadsSettings': './src/pages/ChinaLeadsSettingsPage.tsx',
  },
  shared: (libraryName, defaultConfig) => {
    if (coreLibraries.has(libraryName)) {
      return {
        ...defaultConfig,
        singleton: true,
      };
    }

    return false;
  },
};

export default config;
