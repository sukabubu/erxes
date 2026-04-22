import { initTRPC } from '@trpc/server';
import { ITRPCContext } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { z } from 'zod';
import { runJobWithExecutor, syncJobItems } from '@/china-leads/service';

export type ChinaLeadsTRPCContext = ITRPCContext<{ models: IModels }>;

const t = initTRPC.context<ChinaLeadsTRPCContext>().create();

export const appRouter = t.router({
  chinaLeads: t.router({
    ruleSets: t.router({
      list: t.procedure.query(async ({ ctx }) => {
        return ctx.models.ChinaLeadRuleSets.find({}).sort({ updatedAt: -1 }).lean();
      }),
    }),
    jobs: t.router({
      list: t.procedure.query(async ({ ctx }) => {
        return ctx.models.ChinaLeadJobs.find({}).sort({ createdAt: -1 }).lean();
      }),
      run: t.procedure.input(z.any()).mutation(async ({ ctx, input }) => {
        const job = await ctx.models.ChinaLeadJobs.createJob({
          name: input.name,
          ruleSetId: input.ruleSetId,
          channel: input.channel,
          status: 'queued',
          executorBaseUrl: input.executorBaseUrl,
          configSnapshot: input.configSnapshot || {},
          createdBy: ctx.userId,
        });

        return runJobWithExecutor(ctx.models, job._id);
      }),
      sync: t.procedure
        .input(z.object({ jobId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          return syncJobItems(ctx.subdomain, ctx.models, input.jobId);
        }),
    }),
  }),
});
