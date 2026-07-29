import { AuthenticationParser } from '../parsers/authentication.parser';

describe('AuthenticationParser', () => {
  let parser: AuthenticationParser;

  beforeEach(() => {
    parser = new AuthenticationParser();
  });

  it('should correctly parse a 4624 Success event', () => {
    const rawMock = {
      Event: {
        System: {
          EventID: 4624,
          Computer: 'DC01.cybermind.local'
        },
        EventData: {
          Data: [
            { _attributes: { Name: 'TargetUserName' }, _text: 'Admin' },
            { _attributes: { Name: 'TargetDomainName' }, _text: 'CYBERMIND' },
            { _attributes: { Name: 'IpAddress' }, _text: '192.168.1.100' }
          ]
        }
      }
    };

    const result = parser.parse(rawMock);
    
    expect(result.extractedFields.eventId).toBe(4624);
    expect(result.extractedFields.category).toBe('AUTHENTICATION');
    expect(result.extractedFields.action).toBe('LOGIN_SUCCESS');
    expect(result.extractedFields.targetUser).toBe('Admin');
    expect(result.extractedFields.targetDomain).toBe('CYBERMIND');
    expect(result.extractedFields.ipAddress).toBe('192.168.1.100');
    expect(result.hostname).toBe('DC01.cybermind.local');
    expect(result.assetResolved).toBe(false);
  });
});
