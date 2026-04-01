import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  useAlerts,
  useAcknowledgeAlert,
  useResolveAlert,
} from '../../hooks/use-intelligence';
import type { IntelligenceAlert } from '@auditarmour/types';

const severityStyles: Record<string, string> = {
  high: 'bg-red-50/80 text-brand-red dark:bg-red-500/10 dark:text-red-400',
  medium: 'bg-amber-50/80 text-brand-amber dark:bg-amber-500/10 dark:text-amber-400',
  low: 'bg-blue-50/80 text-brand-blue dark:bg-blue-500/10 dark:text-blue-400',
};

const statusStyles: Record<string, string> = {
  active: 'bg-red-50/80 text-brand-red dark:bg-red-500/10 dark:text-red-400',
  acknowledged: 'bg-amber-50/80 text-brand-amber dark:bg-amber-500/10 dark:text-amber-400',
  resolved: 'bg-emerald-50/80 text-brand-green dark:bg-emerald-500/10 dark:text-emerald-400',
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
    <div className="bg-transparent">
      <PageHeader
        title="Intelligence"
        description="Predictive alerts and trend analysis"
        actions={
          activeCount > 0 ? (
            <span className="rounded-full bg-red-50/80 px-3.5 py-1.5 text-sm font-medium text-brand-red dark:bg-red-500/10 dark:text-red-400">
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
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Alert list */}
        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading alerts...</p>
        ) : !alerts?.length ? (
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-8 text-center shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-400">
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
      className={`rounded-2xl bg-white/70 backdrop-blur-xl shadow-sm border transition-colors ${
        alert.severity === 'high' ? 'border-red-200/50 dark:border-red-500/20' : 'border-white/20 dark:border-white/10'
      } dark:bg-white/5`}
    >
      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg">
              {typeIcons[alert.alert_type] ?? '\u26A0'}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className={`rounded-full px-2.5 py-0.5 font-medium ${severityStyles[alert.severity ?? 'low'] ?? ''}`}>
                  {alert.severity}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {typeLabels[alert.alert_type] ?? alert.alert_type}
                </span>
                {alert.facility_areas?.name && (
                  <span className="text-gray-500 dark:text-gray-400">{alert.facility_areas.name}</span>
                )}
                {alert.category_code && (
                  <span className="text-gray-500 dark:text-gray-400">{alert.category_code.replace(/_/g, ' ')}</span>
                )}
              </div>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[alert.status] ?? ''}`}>
            {alert.status}
          </span>
        </div>

        {/* Expandable description */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-300"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>

        {expanded && (
          <div className="mt-2.5 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">{alert.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Generated {new Date(alert.generated_at).toLocaleDateString('en-AU', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {alert.acknowledged_at && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
                className="rounded-xl border border-amber-200 bg-amber-50/50 px-3.5 py-1.5 text-xs font-medium text-brand-amber hover:bg-amber-50 disabled:opacity-50 transition-colors dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/20"
              >
                Acknowledge
              </button>
            )}
            <button
              onClick={onResolve}
              disabled={isPending}
              className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-3.5 py-1.5 text-xs font-medium text-brand-green hover:bg-emerald-50 disabled:opacity-50 transition-colors dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
            >
              Resolve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
