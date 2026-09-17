'use client';

import CveDetailPage from '../../cve/[id]/CveDetailClient';
import FirewallDetailPage from '../../firewall/[id]/FirewallDetailClient';
import FirewallQbrClient from '../../firewall/[id]/qbr/FirewallQbrClient';
import InvestigationDetail from '../../investigations/[id]/InvestigationDetailClient';
import QbrReportView from '../../qbr/[id]/QbrDetailClient';
import VaptDetailPage from '../../vapt/[id]/VaptDetailClient';

export function ViewRouter({ slug }: { slug: string[] }) {
  if (!slug || slug.length === 0) {
    return <div className="p-6 text-center text-muted-foreground">Invalid route</div>;
  }

  const [type, id, sub] = slug;

  if (type === 'cve') {
    return <CveDetailPage routeId={id} />;
  }

  if (type === 'firewall') {
    if (sub === 'qbr') {
      return <FirewallQbrClient routeId={id} />;
    }
    return <FirewallDetailPage routeId={id} />;
  }

  if (type === 'investigations') {
    return <InvestigationDetail routeId={id} />;
  }

  if (type === 'qbr') {
    return <QbrReportView routeId={id} />;
  }

  if (type === 'vapt') {
    return <VaptDetailPage routeId={id} />;
  }

  return <div className="p-6 text-center text-muted-foreground">View not found</div>;
}
