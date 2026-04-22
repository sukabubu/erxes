import { mongooseStringRandomId, schemaWrapper } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

export const ruleSetSchema = schemaWrapper(
  new Schema({
    _id: mongooseStringRandomId,
    name: { type: String, required: true, index: true },
    description: { type: String, optional: true },
    channel: {
      type: String,
      enum: ['douyin', 'xiaohongshu'],
      default: 'douyin',
      index: true,
    },
    keywords: { type: [String], default: [] },
    days: { type: Number, default: 1 },
    target: { type: Number, default: 100 },
    pages: { type: Number, default: 2 },
    count: { type: Number, default: 50 },
    scrollLoops: { type: Number, default: 28 },
    extraNameExcludes: { type: [String], default: [] },
    extraCommentExcludes: { type: [String], default: [] },
    positiveKeywords: { type: [String], default: [] },
    scoreRules: {
      type: [
        new Schema(
          {
            keyword: { type: String },
            score: { type: Number, default: 0 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    autoSync: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, optional: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }),
);
