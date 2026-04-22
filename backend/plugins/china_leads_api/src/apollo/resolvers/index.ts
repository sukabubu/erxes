import { apolloCustomScalars } from 'erxes-api-shared/utils';
import { runJobWithExecutor, syncJobItems } from '@/china-leads/service';

const resolvers: any = {
  Query: {
    chinaLeadRuleSets: async (_root, _args, { models }) => {
      return models.ChinaLeadRuleSets.find({}).sort({ updatedAt: -1 });
    },
    chinaLeadRuleSetDetail: async (_root, { _id }, { models }) => {
      return models.ChinaLeadRuleSets.findOne({ _id });
    },
    chinaLeadJobs: async (_root, _args, { models }) => {
      return models.ChinaLeadJobs.find({}).sort({ createdAt: -1 });
    },
    chinaLeadJobDetail: async (_root, { _id }, { models }) => {
      return models.ChinaLeadJobs.findOne({ _id });
    },
    chinaLeadItems: async (_root, { jobId }, { models }) => {
      return models.ChinaLeadItems.find({ jobId }).sort({ score: -1, createdAt: -1 });
    },
  },

  Mutation: {
    chinaLeadRuleSetsAdd: async (_root, { doc }, { models, user }) => {
      return models.ChinaLeadRuleSets.createRuleSet({
        ...doc,
        createdBy: user?._id,
      });
    },
    chinaLeadRuleSetsEdit: async (_root, { _id, doc }, { models }) => {
      return models.ChinaLeadRuleSets.updateRuleSet(_id, doc);
    },
    chinaLeadRuleSetsRemove: async (_root, { _id }, { models }) => {
      await models.ChinaLeadRuleSets.removeRuleSet(_id);
      return { status: 'ok' };
    },
    chinaLeadJobsRun: async (_root, { doc }, { models, user }) => {
      const job = await models.ChinaLeadJobs.createJob({
        ruleSetId: doc.ruleSetId,
        name: doc.name,
        channel: doc.channel,
        status: 'queued',
        executorBaseUrl: doc.executorBaseUrl,
        createdBy: user?._id,
        configSnapshot: {
          cookie: doc.cookie,
          keywords: doc.keywords,
          days: doc.days,
          target: doc.target,
          pages: doc.pages,
          count: doc.count,
          scrollLoops: doc.scrollLoops,
          extraNameExcludes: doc.extraNameExcludes,
          extraCommentExcludes: doc.extraCommentExcludes,
          positiveKeywords: doc.positiveKeywords,
          scoreRules: doc.scoreRules,
        },
      });

      try {
        return await runJobWithExecutor(models, job._id);
      } catch (error) {
        await models.ChinaLeadJobs.updateJob(job._id, {
          status: 'failed',
          errorMessage: error.message,
          finishedAt: new Date(),
        });

        return models.ChinaLeadJobs.getJob(job._id);
      }
    },
    chinaLeadJobsSync: async (_root, { _id }, { models, subdomain }) => {
      return syncJobItems(subdomain, models, _id);
    },
  },

  ...apolloCustomScalars,
};

export default resolvers;
