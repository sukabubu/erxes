import { leadItemSchema } from '../definitions/leadItems';
import { ILeadItem, ILeadItemDocument, ILeadItemModel } from '../../types';

export const loadLeadItemClass = () => {
  class LeadItem {
    public static async createLeadItem(this: any, doc: ILeadItem) {
      return this.create({
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    public static async bulkReplaceForJob(
      this: any,
      jobId: string,
      docs: ILeadItem[],
    ) {
      await this.deleteMany({ jobId });

      if (!docs.length) {
        return 0;
      }

      const normalized = docs.map((doc) => ({
        ...doc,
        jobId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await this.insertMany(normalized, { ordered: false });

      return normalized.length;
    }
  }

  leadItemSchema.loadClass(LeadItem);
  return leadItemSchema;
};

export type { ILeadItemDocument, ILeadItemModel };
