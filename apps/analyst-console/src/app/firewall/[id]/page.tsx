'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Shield, FileText, CheckCircle2, AlertTriangle, XCircle, Info, Save } from 'lucide-react';
import axios from '@/lib/api';
import { CheckControl, FindingRecord, FirewallAssessment } from '@/lib/firewall-store';

export default function AssessmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [localFindings, setLocalFindings] = useState<FindingRecord[]>([]);
  const [controls, setControls] = useState<CheckControl[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const { data: assessment, isLoading, error } = useQuery<FirewallAssessment>({
    queryKey: ['firewall-assessment', id],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/firewall/assessments/${id}`);
      return res.data;
    },
  });

  // Fetch controls for this vendor
  useEffect(() => {
    if (assessment?.vendor) {
      axios.get(`/api/v1/firewall/vendors/${assessment.vendor}/controls`).then(res => {
        setControls(res.data);
      }).catch(console.error);
    }
  }, [assessment?.vendor]);

  // Sync local findings state
  useEffect(() => {
    if (assessment?.findings) {
      setLocalFindings(assessment.findings);
    }
  }, [assessment]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<FirewallAssessment>) => {
      const res = await axios.put(`/api/v1/firewall/assessments/${id}`, updates);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['firewall-assessment', id], data);
      setIsEditing(false);
    },
  });

  const handleStatusChange = (controlId: string, status: FindingRecord['status']) => {
    setLocalFindings(prev => prev.map(f => f.controlId === controlId ? { ...f, status } : f));
    setIsEditing(true);
  };

  const handleNotesChange = (controlId: string, notes: string) => {
    setLocalFindings(prev => prev.map(f => f.controlId === controlId ? { ...f, notes } : f));
    setIsEditing(true);
  };
  
  const handleEvidenceChange = (controlId: string, evidence: string) => {
    setLocalFindings(prev => prev.map(f => f.controlId === controlId ? { ...f, evidence } : f));
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate({ findings: localFindings });
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error || !assessment) return <div className="p-8 text-red-500">Failed to load assessment</div>;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityBadge = (s: string) => {
    switch (s) {
      case 'CRITICAL': return <Badge variant="destructive">Critical</Badge>;
      case 'HIGH': return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case 'MEDIUM': return <Badge variant="secondary" className="bg-yellow-500 text-black">Medium</Badge>;
      case 'LOW': return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const stats = {
    pass: localFindings.filter(f => f.status === 'PASS').length,
    fail: localFindings.filter(f => f.status === 'FAIL').length,
    warning: localFindings.filter(f => f.status === 'WARNING').length,
    manual: localFindings.filter(f => f.status === 'MANUAL_REVIEW').length,
  };

  // Group controls by category
  const controlsByCategory = controls.reduce((acc, control) => {
    if (!acc[control.category]) acc[control.category] = [];
    acc[control.category].push(control);
    return acc;
  }, {} as Record<string, CheckControl[]>);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{assessment.customerName}</h2>
          <div className="flex items-center space-x-2 mt-2 text-muted-foreground">
            <Badge variant="outline" className="capitalize">{assessment.vendor}</Badge>
            <span>{assessment.model}</span>
            <span>•</span>
            <span>{assessment.siteName}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-sm text-muted-foreground mb-1">Health Score</span>
            <div className={`text-4xl font-bold ${getScoreColor(assessment.overallScore)}`}>
              {assessment.overallScore}%
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push(`/firewall/${id}/qbr`)}>
            <FileText className="mr-2 h-4 w-4" />
            Generate QBR
          </Button>
          <Button onClick={handleSave} disabled={!isEditing || updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Findings'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pass}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fail}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.warning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Review</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.manual}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(assessment.categoryScores || {}).map(([cat, score]) => (
            <div key={cat} className="flex items-center gap-4">
              <div className="w-48 text-sm font-medium">{cat}</div>
              <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                <div 
                  className={`h-full ${getScoreBg(score as number)}`} 
                  style={{ width: `${score}%` }} 
                />
              </div>
              <div className="w-12 text-right text-sm font-bold">{score}%</div>
            </div>
          ))}
          {Object.keys(assessment.categoryScores || {}).length === 0 && (
             <div className="text-sm text-muted-foreground">Complete assessment to see category scores.</div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(controlsByCategory).map(([category, catsControls]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead className="w-[200px]">Control Name</TableHead>
                    <TableHead className="w-24">Severity</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                    <TableHead>Evidence / Expected</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catsControls.map(control => {
                    const finding = localFindings.find(f => f.controlId === control.id);
                    if (!finding) return null;
                    
                    return (
                      <TableRow key={control.id}>
                        <TableCell className="font-mono text-xs">{control.id}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{control.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1" title={control.description}>{control.description}</div>
                        </TableCell>
                        <TableCell>{getSeverityBadge(control.severity)}</TableCell>
                        <TableCell>
                          <select 
                            className="bg-transparent border rounded p-1 text-sm w-full"
                            value={finding.status}
                            onChange={(e) => handleStatusChange(control.id, e.target.value as any)}
                          >
                            <option value="MANUAL_REVIEW">Manual Review</option>
                            <option value="PASS">Pass</option>
                            <option value="FAIL">Fail</option>
                            <option value="WARNING">Warning</option>
                            <option value="NOT_APPLICABLE">N/A</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground mb-1 font-mono">{control.expectedConfig}</div>
                          <Input 
                            placeholder="Actual evidence..." 
                            value={finding.evidence}
                            onChange={(e) => handleEvidenceChange(control.id, e.target.value)}
                            className="h-7 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            placeholder="Notes..." 
                            value={finding.notes}
                            onChange={(e) => handleNotesChange(control.id, e.target.value)}
                            className="h-7 text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
