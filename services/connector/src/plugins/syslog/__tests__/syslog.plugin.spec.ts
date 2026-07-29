import { SyslogPlugin } from '../syslog.plugin';
import { CybermindAssetClient } from '@cybermind-os/asset-client';

describe('SyslogPlugin', () => {
  let plugin: SyslogPlugin;
  let mockAssetClient: jest.Mocked<CybermindAssetClient>;

  beforeEach(() => {
    mockAssetClient = {
      searchAssets: jest.fn().mockResolvedValue([]),
    } as any;
    plugin = new SyslogPlugin(mockAssetClient);
  });

  it('should parse RFC 3164 and route to Firewall parser', async () => {
    const rawFirewallMsg = '<134>Oct 11 22:14:15 fw01.cybermind.local FW: Connection allowed SRC=10.0.0.5 DST=8.8.8.8';
    
    const parsed = await plugin.parse([rawFirewallMsg]);
    
    expect(parsed.length).toBe(1);
    expect(parsed[0].extractedFields.category).toBe('NETWORK');
    expect(parsed[0].extractedFields.action).toBe('CONNECTION_ALLOWED');
    expect(parsed[0].extractedFields.sourceIp).toBe('10.0.0.5');
    expect(parsed[0].hostname).toBe('fw01.cybermind.local');
    
    const canonical = await plugin.transform(parsed);
    expect(canonical.length).toBe(1);
    expect(canonical[0].rawPayload).toBe(rawFirewallMsg);
    expect(canonical[0].category).toBe('NETWORK');
  });

  it('should parse RFC 5424 and route to Linux parser', async () => {
    const rawLinuxMsg = '<34>1 2003-10-11T22:14:15.003Z server1.cybermind.local sshd - - - Failed password for invalid user admin';
    
    const parsed = await plugin.parse([rawLinuxMsg]);
    
    expect(parsed[0].extractedFields.category).toBe('AUTHENTICATION');
    expect(parsed[0].extractedFields.action).toBe('LOGIN_FAILURE');
    expect(parsed[0].extractedFields.targetUser).toBe('admin');
    
    const resolved = await plugin.resolveAssets(parsed);
    expect(mockAssetClient.searchAssets).toHaveBeenCalledWith('SYSTEM_TOKEN', { query: 'server1.cybermind.local' });
  });
});
