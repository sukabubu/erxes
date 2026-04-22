import { jobSchema } from '../definitions/jobs';
import { IJob, IJobDocument, IJobModel } from '../../types';

export const loadJobClass = () => {
  class Job {
    public static async getJob(this: any, _id: string) {
      const item = await this.findOne({ _id });
      if (!item) {
        throw new Error('Job not found');
      }
      return item;
    }

    public static async createJob(this: any, doc: IJob) {
      return this.create({
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    public static async updateJob(
      this: any,
      _id: string,
      doc: Partial<IJob>,
    ) {
      await this.updateOne(
        { _id },
        { $set: { ...doc, updatedAt: new Date() } },
      );
      return this.getJob(_id);
    }
  }

  jobSchema.loadClass(Job);
  return jobSchema;
};

export type { IJobDocument, IJobModel };
