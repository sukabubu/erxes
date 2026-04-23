import gql from 'graphql-tag';

export const ADD_CHINA_LEAD_RULE_SET = gql`
  mutation AddChinaLeadRuleSet($doc: ChinaLeadRuleSetInput!) {
    chinaLeadRuleSetsAdd(doc: $doc) {
      _id
      name
      channel
      executorBaseUrl
      keywords
    }
  }
`;

export const RUN_CHINA_LEAD_JOB = gql`
  mutation RunChinaLeadJob($doc: ChinaLeadRunJobInput!) {
    chinaLeadJobsRun(doc: $doc) {
      _id
      name
      status
      errorMessage
      outputPath
      stats
    }
  }
`;

export const SYNC_CHINA_LEAD_JOB = gql`
  mutation SyncChinaLeadJob($_id: String!) {
    chinaLeadJobsSync(_id: $_id) {
      jobId
      total
      synced
      skipped
      failed
      customerIds
      dealIds
    }
  }
`;
