'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ScrollText,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';
import { useAuditLogs, formatActionName, getActionColor } from '@/hooks/use-audit-logs';
import { Header } from '@/components/layout/header';
import { format } from 'date-fns';

function formatDate(dateString: string): string {
  return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string>('');
  const [resource, setResource] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filters = {
    action: action || undefined,
    resource: resource || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  const { data, isLoading, error, refetch } = useAuditLogs(page, filters);

  const clearFilters = () => {
    setAction('');
    setResource('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasFilters = action || resource || dateFrom || dateTo;

  const totalPages = data?.meta ? Math.ceil(data.meta.total / data.meta.limit) : 0;

  return (
    <>
      <Header title="Audit Logs" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              {/* Action Filter */}
              <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  {data?.meta.filters.actions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {formatActionName(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Resource Filter */}
              <Select value={resource} onValueChange={(v) => { setResource(v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Resources</SelectItem>
                  {data?.meta.filters.resources.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-36"
                  placeholder="From"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-36"
                  placeholder="To"
                />
              </div>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Activity Log
              </CardTitle>
              {data?.meta && (
                <span className="text-sm text-muted-foreground">
                  {data.meta.total} total entries
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-muted-foreground">Failed to load audit logs</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.data.length === 0 ? (
              <div className="text-center py-8">
                <ScrollText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No audit logs found</p>
                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          {log.users ? (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{log.users.full_name}</p>
                                <p className="text-xs text-muted-foreground">{log.users.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            {formatActionName(log.action)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm capitalize">{log.resource}</p>
                            {log.resource_id && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {log.resource_id.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {Object.keys(log.details || {}).length > 0 ? (
                            <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto max-h-20">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
