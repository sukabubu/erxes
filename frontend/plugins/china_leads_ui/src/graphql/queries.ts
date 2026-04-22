import gql from 'graphql-tag';

export const GET_CHINA_LEAD_RULE_SETS = gql`
  query GetChinaLeadRuleSets {
    chinaLeadRuleSets {
      _id
      name
      description
      channel
      keywords
      days
      target
      pages
      count
      scrollLoops
      extraNameExcludes
      extraCommentExcludes
      positiveKeywords
      autoSync
      isActive
      scoreRules {
        keyword
        score
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_CHINA_LEAD_JOBS = gql`
  query GetChinaLeadJobs {
    chinaLeadJobs {
      _id
      ruleSetId
      name
      channel
      status
      executorBaseUrl
      startedAt
      finishedAt
      errorMessage
      outputPath
      stats
      createdAt
      updatedAt
    }
  }
`;

export const GET_CHINA_LEAD_ITEMS = gql`
  query GetChinaLeadItems($jobId: String!) {
    chinaLeadItems(jobId: $jobId) {
      _id
      jobId
      channel
      keyword
      sourcePostUrl
      sourceAuthor
      commentNickname
      commentProfileUrl
      commentText
      ipLocation
      score
      matchedRules
      syncStatus
      syncError
      customerId
      dealId
    }
  }
`;
