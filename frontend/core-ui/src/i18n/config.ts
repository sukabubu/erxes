import { initReactI18next } from 'react-i18next';
import i18n, { InitOptions } from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { REACT_APP_API_URL } from 'erxes-ui';

import zhAutomations from '../../../../backend/gateway/src/locales/zh/automations.json';
import zhBroadcasts from '../../../../backend/gateway/src/locales/zh/broadcasts.json';
import zhCommon from '../../../../backend/gateway/src/locales/zh/common.json';
import zhContact from '../../../../backend/gateway/src/locales/zh/contact.json';
import zhDocuments from '../../../../backend/gateway/src/locales/zh/documents.json';
import zhOrganization from '../../../../backend/gateway/src/locales/zh/organization.json';
import zhProduct from '../../../../backend/gateway/src/locales/zh/product.json';
import zhSegment from '../../../../backend/gateway/src/locales/zh/segment.json';
import zhSettings from '../../../../backend/gateway/src/locales/zh/settings.json';
import zhTemplates from '../../../../backend/gateway/src/locales/zh/templates.json';

const supportedLngs = ['en', 'mn', 'zh'];

const bundledResources = {
  zh: {
    common: zhCommon,
    contact: zhContact,
    product: zhProduct,
    documents: zhDocuments,
    organization: zhOrganization,
    segment: zhSegment,
    automations: zhAutomations,
    settings: zhSettings,
    broadcasts: zhBroadcasts,
    templates: zhTemplates,
  },
};

export const defaultI18nOptions: InitOptions = {
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
  supportedLngs,
  backend: {
    loadPath: `${REACT_APP_API_URL}/locales/{{lng}}/{{ns}}.json`,
  },
  ns: ['common', 'contact', 'product', 'documents', 'organization', 'segment', 'automations', 'settings', 'broadcasts', 'templates'],
  defaultNS: 'common',
  fallbackNS: ['common'],
  react: {
    useSuspense: true,
  },
};

export const i18nInstance = i18n.createInstance();

i18nInstance.on('languageChanged', (lng) => {
  localStorage.setItem('lng', lng);
});

const lng = 'zh';

i18nInstance
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    ...defaultI18nOptions,
    lng,
    resources: bundledResources,
  });

void i18nInstance.changeLanguage('zh');
