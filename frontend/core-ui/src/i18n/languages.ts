import { enUS, mn, zhCN } from 'date-fns/locale';

import { Language } from './types';

export const languages: Language[] = [
  {
    code: 'en',
    display_name: 'English',
    ltr: true,
    date_locale: enUS,
  },
  {
    code: 'mn',
    display_name: 'Mongolian',
    ltr: false,
    date_locale: mn,
  },
  {
    code: 'zh',
    display_name: '中文',
    ltr: true,
    date_locale: zhCN,
  },
];
