import { identityClient } from './identity-client';

describe('identityClient', () => {
  it('should work', () => {
    expect(identityClient()).toEqual('identity-client');
  });
});
