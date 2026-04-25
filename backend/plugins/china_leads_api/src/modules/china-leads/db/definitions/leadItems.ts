import { mongooseStringRandomId, schemaWrapper } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

export const leadItemSchema = schemaWrapper(
  new Schema({
    _id: mongooseStringRandomId,
    jobId: { type: String, required: true, index: true },
    channel: {
      type: String,
      enum: ['douyin', 'xiaohongshu'],
      default: 'douyin',
      index: true,
    },
    keyword: { type: String, optional: true },
    sourcePostId: { type: String, optional: true },
    sourcePostUrl: { type: String, optional: true },
    sourceAuthor: { type: String, optional: true },
    sourceContent: { type: String, optional: true },
    sourceCreatedAt: { type: Date, optional: true },
    commentUserId: { type: String, optional: true, index: true },
    commentNickname: { type: String, optional: true },
    commentProfileUrl: { type: String, optional: true },
    commentText: { type: String, optional: true },
    ipLocation: { type: String, optional: true },
    score: { type: Number, default: 0 },
    matchedRules: { type: [String], default: [] },
    raw: { type: Object, default: {} },
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'skipped', 'failed'],
      default: 'pending',
      index: true,
    },
    syncError: { type: String, optional: true },
    customerId: { type: String, optional: true, index: true },
    customerLink: { type: String, optional: true },
    customerOwnerId: { type: String, optional: true, index: true },
    customerTagIds: { type: [String], optional: true, default: [] },
    customerSyncAction: {
      type: String,
      enum: ['created', 'updated'],
      optional: true,
    },
    dealId: { type: String, optional: true, index: true },
    dealLink: { type: String, optional: true },
    dealStageId: { type: String, optional: true, index: true },
    dealStageName: { type: String, optional: true },
    dealSyncAction: {
      type: String,
      enum: ['created', 'updated'],
      optional: true,
    },
    funnelStageKey: { type: String, optional: true, index: true },
    funnelStageLabel: { type: String, optional: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }),
);

leadItemSchema.index(
  { jobId: 1, channel: 1, commentUserId: 1 },
  {
    unique: true,
    partialFilterExpression: { commentUserId: { $exists: true } },
  },
);
