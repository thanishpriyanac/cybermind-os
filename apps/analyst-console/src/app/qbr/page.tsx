'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { Skeleton } from '../../components/ui/skeleton';
import Link from 'next/link';
import { FileText, Download } from 'lucide-react';

interface QbrReport {
  id: string;
  customerName: string;
  vendor: string;
  overallScore: number;
  reportDate: string;
  status: string;
}

export default function QbrReportsPage() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['qbr-reports'],
    queryFn: async () => {
      const res = await api.get('/v1/qbr');
      return res.data.data as QbrReport[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">QBR Reports</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports && reports.length > 0 ? (
                  reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.customerName}</TableCell>
                      <TableCell className="capitalize">{r.vendor}</TableCell>
                      <TableCell>
                        <Badge variant={r.overallScore >= 80 ? 'default' : r.overallScore >= 50 ? 'secondary' : 'destructive'} className={r.overallScore >= 50 && r.overallScore < 80 ? 'bg-yellow-500 text-black' : ''}>
                          {r.overallScore}/100
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(r.reportDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/qbr/${r.id}`}>
                          <Button variant="ghost" size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => alert('PDF generation coming soon')}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
