import { ruleSetSchema } from '../definitions/ruleSets';
import { IRuleSet, IRuleSetDocument, IRuleSetModel } from '../../types';

export const loadRuleSetClass = () => {
  class RuleSet {
    public static async getRuleSet(this: any, _id: string) {
      const item = await this.findOne({ _id });
      if (!item) {
        throw new Error('Rule set not found');
      }
      return item;
    }

    public static async createRuleSet(this: any, doc: IRuleSet) {
      return this.create({
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    public static async updateRuleSet(
      this: any,
      _id: string,
      doc: Partial<IRuleSet>,
    ) {
      await this.updateOne(
        { _id },
        { $set: { ...doc, updatedAt: new Date() } },
      );
      return this.getRuleSet(_id);
    }

    public static async removeRuleSet(this: any, _id: string) {
      await this.deleteOne({ _id });
    }
  }

  ruleSetSchema.loadClass(RuleSet);
  return ruleSetSchema;
};

export type { IRuleSetDocument, IRuleSetModel };
