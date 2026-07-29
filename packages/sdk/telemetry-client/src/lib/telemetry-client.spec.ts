import { telemetryClient } from './telemetry-client';

describe('telemetryClient', () => {
  it('should work', () => {
    expect(telemetryClient()).toEqual('telemetry-client');
  });
});
