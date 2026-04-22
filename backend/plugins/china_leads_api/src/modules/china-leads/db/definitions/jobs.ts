import { mongooseStringRandomId, schemaWrapper } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

export const jobSchema = schemaWrapper(
  new Schema({
    _id: mongooseStringRandomId,
    ruleSetId: { type: String, optional: true, index: true },
    name: { type: String, required: true },
    channel: {
      type: String,
      enum: ['douyin', 'xiaohongshu'],
      default: 'douyin',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'queued', 'running', 'succeeded', 'failed', 'partial'],
      default: 'draft',
      index: true,
    },
    configSnapshot: { type: Object, default: {} },
    executorBaseUrl: { type: String, optional: true },
    executorJobId: { type: String, optional: true },
    startedAt: { type: Date, optional: true },
    finishedAt: { type: Date, optional: true },
    errorMessage: { type: String, optional: true },
    stats: { type: Object, optional: true },
    outputPath: { type: String, optional: true },
    resultPreview: { type: [Object], default: [] },
    createdBy: { type: String, optional: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }),
);
