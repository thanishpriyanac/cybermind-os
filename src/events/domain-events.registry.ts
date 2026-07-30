export const DomainEvents = {
  ConversationCreated: 'ConversationCreated',
  ConversationCompleted: 'ConversationCompleted',
  ProviderStarted: 'ProviderStarted',
  ProviderFinished: 'ProviderFinished',
  ProviderError: 'ProviderError',
  ConsensusGenerated: 'ConsensusGenerated',
  ArticleIngested: 'ArticleIngested',
  FileUploaded: 'FileUploaded',
  MetadataExtracted: 'MetadataExtracted',
  StaticAnalysisCompleted: 'StaticAnalysisCompleted',
  IocExtracted: 'IocExtracted',
  InvestigationCompleted: 'InvestigationCompleted',
  ReviewRequested: 'ReviewRequested',
  ReviewCompleted: 'ReviewCompleted',
  ConfidenceAdjusted: 'ConfidenceAdjusted',
  EntityVerified: 'EntityVerified',
  EntityMerged: 'EntityMerged',
  EntityExtracted: 'EntityExtracted',
  DatasetGenerated: 'DatasetGenerated',
} as const;

export type DomainEventType = typeof DomainEvents[keyof typeof DomainEvents];
