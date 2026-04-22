import mongoose from 'mongoose';
import { createGenerateModels } from 'erxes-api-shared/utils';
import { IMainContext } from 'erxes-api-shared/core-types';
import {
  IJobDocument,
  IJobModel,
  ILeadItemDocument,
  ILeadItemModel,
  IRuleSetDocument,
  IRuleSetModel,
} from '@/china-leads/types';
import { loadJobClass } from '@/china-leads/db/models/Jobs';
import { loadLeadItemClass } from '@/china-leads/db/models/LeadItems';
import { loadRuleSetClass } from '@/china-leads/db/models/RuleSets';

export interface IModels {
  ChinaLeadRuleSets: IRuleSetModel;
  ChinaLeadJobs: IJobModel;
  ChinaLeadItems: ILeadItemModel;
}

export interface IContext extends IMainContext {
  models: IModels;
  subdomain: string;
}

export const loadClasses = (db: mongoose.Connection): IModels => {
  const models = {} as IModels;

  models.ChinaLeadRuleSets = db.model<IRuleSetDocument, IRuleSetModel>(
    'china_lead_rule_sets',
    loadRuleSetClass(),
  );

  models.ChinaLeadJobs = db.model<IJobDocument, IJobModel>(
    'china_lead_jobs',
    loadJobClass(),
  );

  models.ChinaLeadItems = db.model<ILeadItemDocument, ILeadItemModel>(
    'china_lead_items',
    loadLeadItemClass(),
  );

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
