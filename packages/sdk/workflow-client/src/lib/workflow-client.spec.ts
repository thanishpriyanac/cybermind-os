import { workflowClient } from './workflow-client';

describe('workflowClient', () => {
  it('should work', () => {
    expect(workflowClient()).toEqual('workflow-client');
  });
});
