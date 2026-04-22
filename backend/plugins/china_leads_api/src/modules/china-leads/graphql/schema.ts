export const types = `
  type ChinaLeadRuleScoreRule {
    keyword: String
    score: Float
  }

  type ChinaLeadRuleSet {
    _id: String!
    name: String!
    description: String
    channel: String!
    keywords: [String!]!
    days: Int!
    target: Int!
    pages: Int!
    count: Int!
    scrollLoops: Int!
    extraNameExcludes: [String!]!
    extraCommentExcludes: [String!]!
    positiveKeywords: [String!]!
    autoSync: Boolean!
    isActive: Boolean!
    createdBy: String
    createdAt: Date
    updatedAt: Date
    scoreRules: [ChinaLeadRuleScoreRule!]!
  }

  type ChinaLeadJob {
    _id: String!
    ruleSetId: String
    name: String!
    channel: String!
    status: String!
    executorBaseUrl: String
    startedAt: Date
    finishedAt: Date
    errorMessage: String
    outputPath: String
    createdBy: String
    createdAt: Date
    updatedAt: Date
    stats: JSON
    configSnapshot: JSON
    resultPreview: JSON
  }

  type ChinaLeadItem {
    _id: String!
    jobId: String!
    channel: String!
    keyword: String
    sourcePostUrl: String
    sourceAuthor: String
    commentNickname: String
    commentProfileUrl: String
    commentText: String
    ipLocation: String
    score: Float
    matchedRules: [String!]!
    syncStatus: String!
    syncError: String
    customerId: String
    dealId: String
    raw: JSON
  }

  type ChinaLeadSyncResult {
    jobId: String!
    total: Int!
    synced: Int!
    skipped: Int!
    failed: Int!
    customerIds: [String!]!
    dealIds: [String!]!
  }

  input ChinaLeadRuleScoreRuleInput {
    keyword: String
    score: Float
  }

  input ChinaLeadRuleSetInput {
    name: String!
    description: String
    channel: String!
    keywords: [String!]!
    days: Int!
    target: Int!
    pages: Int!
    count: Int!
    scrollLoops: Int!
    extraNameExcludes: [String!]!
    extraCommentExcludes: [String!]!
    positiveKeywords: [String!]!
    autoSync: Boolean!
    isActive: Boolean!
    scoreRules: [ChinaLeadRuleScoreRuleInput!]!
  }

  input ChinaLeadRunJobInput {
    ruleSetId: String
    name: String!
    channel: String!
    executorBaseUrl: String
    cookie: String
    keywords: [String!]!
    days: Int!
    target: Int!
    pages: Int!
    count: Int!
    scrollLoops: Int!
    extraNameExcludes: [String!]!
    extraCommentExcludes: [String!]!
    positiveKeywords: [String!]!
    scoreRules: [ChinaLeadRuleScoreRuleInput!]!
  }

`;

export const queries = `
  chinaLeadRuleSets: [ChinaLeadRuleSet!]!
  chinaLeadRuleSetDetail(_id: String!): ChinaLeadRuleSet
  chinaLeadJobs: [ChinaLeadJob!]!
  chinaLeadJobDetail(_id: String!): ChinaLeadJob
  chinaLeadItems(jobId: String!): [ChinaLeadItem!]!
`;

export const mutations = `
  chinaLeadRuleSetsAdd(doc: ChinaLeadRuleSetInput!): ChinaLeadRuleSet
  chinaLeadRuleSetsEdit(_id: String!, doc: ChinaLeadRuleSetInput!): ChinaLeadRuleSet
  chinaLeadRuleSetsRemove(_id: String!): JSON
  chinaLeadJobsRun(doc: ChinaLeadRunJobInput!): ChinaLeadJob
  chinaLeadJobsSync(_id: String!): ChinaLeadSyncResult
`;
