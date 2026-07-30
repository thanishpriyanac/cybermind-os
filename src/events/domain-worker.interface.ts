import { DomainEvent } from './domain-event.interface';

export interface DomainWorker<T = any> {
  supports(eventType: string): boolean;
  processEvent(event: DomainEvent<T>): Promise<void>;
  workerName(): string;
}
