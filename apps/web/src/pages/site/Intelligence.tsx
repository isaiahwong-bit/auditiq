import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  useAlerts,
  useAcknowledgeAlert,
  useResolveAlert,
} from '../../hooks/use-intelligence';
import type { IntelligenceAlert } from '@auditarmour/types';

const severityStyles: Record<string, string> = {
  high: 'bg-brand-red-light text-brand-red border-brand-red/20',
  medium: 'bg-brand-amber-light text-brand-amber border-brand-amber/20',
  low: 'bg-brand-blue-light text-brand-blue border-brand-blue/20',
};

const statusStyles: Record<string, string> = {
  active: 'bg-brand-red-light text-brand-red',
  acknowledged: 'bg-brand-amber-light text-brand-amber',
  resolved: 'bg-brand-green-light text-brand-green',
};

const typeLabels: Record<string, string> = {
  declining_trend: 'Declining Trend',
  pattern_detected: 'Pattern Detected',
  threshold_approaching: 'Threshold Approaching',
  seasonal_risk: 'Seasonal Risk',
};

const typeIcons: Record<string, string> = {
  declining_trend: '\u2198',
  pattern_detected: '\u26A0',
  threshold_approaching: '\u23F0',
  seasonal_risk: '\u2744',
};

type FilterStatus = 'all' | 'active' | 'acknowledged' | 'resolved';

export default function Intelligence() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const { data: alerts, isLoading } = useAlerts(filter === 'all' ? undefined : filter);
  const acknowledge = useAcknowledgeAlert();
  const resolve = useResolveAlert();

  const filters: FilterStatus[] = ['all', 'active', 'acknowledged', 'resolved'];

  const activeCount = alerts?.filter((a) => a.status === 'active').length ?? 0;

  return (
    <div>
      <PageHeader
        title="Intelligence"
        description="Predictive alerts and trend analysis"
        actions={
          activeCount > 0 ? (
            <span className="rounded-full bg-brand-red-light px-3 py-1 text-sm font-medium text-brand-red">
              {activeCount} active
            </span>
          ) : null
        }
      />
      <div className="p-6 md:p-8">
        {/* Status filters */}
        <div className="mb-4 flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Alert list */}
        {isLoading ? (
          <p className="text-sm text-brand-gray">Loading alerts...</p>
        ) : !alerts?.length ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <div className="mb-2 text-3xl">
              {filter === 'all' ? '\u2705' : '\u{1F50D}'}
            </div>
            <p className="text-sm text-brand-gray">
              {filter === 'all'
                ? 'No intelligence alerts. The nightly analysis runs at 2 AM.'
                : `No ${filter} alerts.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => acknowledge.mutate(alert.id)}
                onResolve={() => resolve.mutate(alert.id)}
                isPending={acknowledge.isPending || resolve.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  isPending,
}: {
  alert: IntelligenceAlert & {
    facility_areas?: { name: string } | null;
    check_items?: { name: string } | null;
  };
  onAcknowledge: () => void;
  onResolve: () => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border bg-white ${
        alert.severity === 'high' ? 'border-brand-red/30' : 'border-gray-200'
      }`}
    >
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-lg">
              {typeIcons[alert.alert_type] ?? '\u26A0'}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{alert.title}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${severityStyles[alert.severity ?? 'low'] ?? ''}`}>
                  {alert.severity}
                </span>
                <span className="text-brand-gray">
                  {typeLabels[alert.alert_type] ?? alert.alert_type}
                </span>
                {alert.facility_areas?.name && (
                  <span className="text-brand-gray">{alert.facility_areas.name}</span>
                )}
                {alert.category_code && (
                  <span className="text-brand-gray">{alert.category_code.replace(/_/g, ' ')}</span>
                )}
              </div>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[alert.status] ?? ''}`}>
            {alert.status}
          </span>
        </div>

        {/* Expandable description */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-brand-blue hover:underline"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>

        {expanded && (
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-600">{alert.description}</p>
            <p className="text-xs text-brand-gray">
              Generated {new Date(alert.generated_at).toLocaleDateString('en-AU', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {alert.acknowledged_at && (
              <p className="text-xs text-brand-gray">
                Acknowledged {new Date(alert.acknowledged_at).toLocaleDateString('en-AU')}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {alert.status !== 'resolved' && (
          <div className="mt-3 flex gap-2">
            {alert.status === 'active' && (
              <button
                onClick={onAcknowledge}
                disabled={isPending}
                className="rounded-md border border-brand-amber px-3 py-1.5 text-xs font-medium text-brand-amber hover:bg-brand-amber-light disabled:opacity-50"
              >
                Acknowledge
              </button>
            )}
            <button
              onClick={onResolve}
              disabled={isPending}
              className="rounded-md border border-brand-green px-3 py-1.5 text-xs font-medium text-brand-green hover:bg-brand-green-light disabled:opacity-50"
            >
              Resolve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
