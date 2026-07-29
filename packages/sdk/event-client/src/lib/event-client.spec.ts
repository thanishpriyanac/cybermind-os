import { eventClient } from './event-client';

describe('eventClient', () => {
  it('should work', () => {
    expect(eventClient()).toEqual('event-client');
  });
});
