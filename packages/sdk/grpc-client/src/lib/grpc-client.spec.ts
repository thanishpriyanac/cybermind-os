import { grpcClient } from './grpc-client';

describe('grpcClient', () => {
  it('should work', () => {
    expect(grpcClient()).toEqual('grpc-client');
  });
});
