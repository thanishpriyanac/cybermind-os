import { CheckControl, Vendor } from '../firewall-store';
import { fortinetControls } from './fortinet';
import { paloaltoControls } from './paloalto';

export function getVendorControls(vendor: Vendor): CheckControl[] {
  switch (vendor) {
    case 'fortinet':
      return fortinetControls;
    case 'paloalto':
      return paloaltoControls;
    case 'sophos':
    case 'cisco':
    case 'checkpoint':
      // Placeholder for other vendors, returning empty array or subset for now
      return [];
    default:
      return [];
  }
}

export const vendorList = [
  { id: 'fortinet', name: 'Fortinet FortiGate', controlCount: fortinetControls.length },
  { id: 'paloalto', name: 'Palo Alto Networks', controlCount: paloaltoControls.length },
  { id: 'sophos', name: 'Sophos Firewall', controlCount: 0 },
  { id: 'cisco', name: 'Cisco Secure Firewall', controlCount: 0 },
  { id: 'checkpoint', name: 'Check Point Quantum', controlCount: 0 },
];
