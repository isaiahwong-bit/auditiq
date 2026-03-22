import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  usePreOpSession,
  useCheckItems,
  useSessionResponses,
  useSubmitResponse,
  useCompleteSession,
} from '../../hooks/use-preop';

export default function PreOpSession() {
  const { orgSlug, siteSlug, sessionId } = useParams<{
    orgSlug: string;
    siteSlug: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const { data: session, isLoading: sessionLoading } = usePreOpSession(sessionId);
  const { data: items } = useCheckItems(session?.facility_area_id);
  const { data: responses } = useSessionResponses(sessionId);
  const submitResponse = useSubmitResponse(sessionId!);
  const completeSession = useCompleteSession(sessionId!);

  const [notes, setNotes] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Items that haven't been responded to yet
  const answeredIds = useMemo(
    () => new Set(responses?.map((r) => r.check_item_id) ?? []),
    [responses],
  );
  const unanswered = useMemo(
    () => items?.filter((item) => !answeredIds.has(item.id)) ?? [],
    [items, answeredIds],
  );

  const totalItems = items?.length ?? 0;
  const answeredCount = answeredIds.size;
  const progress = totalItems > 0 ? (answeredCount / totalItems) * 100 : 0;
  const currentItem = unanswered[currentIndex] ?? null;
  const isComplete = unanswered.length === 0 && totalItems > 0;

  // Redirect to summary if session is already complete
  if (session?.status === 'complete') {
    navigate(`/${orgSlug}/sites/${siteSlug}/pre-op-checks/${sessionId}/summary`, { replace: true });
    return null;
  }

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-brand-gray">Loading session...</p>
      </div>
    );
  }

  const handleSubmit = async (result: 'pass' | 'fail' | 'na') => {
    if (!currentItem) return;
    await submitResponse.mutateAsync({
      check_item_id: currentItem.id,
      result,
      notes: notes || null,
      flagged: result === 'fail',
    });
    setNotes('');
    setCurrentIndex(0); // Reset — unanswered list shifts
  };

  const handleComplete = async () => {
    await completeSession.mutateAsync();
    navigate(`/${orgSlug}/sites/${siteSlug}/pre-op-checks/${sessionId}/summary`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:min-h-0">
      {/* Progress bar */}
      <div className="border-b border-gray-200">
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-brand-green transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-brand-gray hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-sm font-medium text-brand-gray">
            {answeredCount} / {totalItems}
          </span>
        </div>
      </div>

      {/* All items answered — show complete */}
      {isComplete ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-light">
            <svg className="h-8 w-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-1 text-lg font-semibold text-gray-900">All items checked</h2>
          <p className="mb-6 text-sm text-brand-gray">
            Review and submit to complete this session.
          </p>

          {/* Quick summary of results */}
          <div className="mb-6 flex gap-4">
            <ResultBadge
              label="Passed"
              count={responses?.filter((r) => r.result === 'pass').length ?? 0}
              color="green"
            />
            <ResultBadge
              label="Failed"
              count={responses?.filter((r) => r.result === 'fail').length ?? 0}
              color="red"
            />
            <ResultBadge
              label="N/A"
              count={responses?.filter((r) => r.result === 'na').length ?? 0}
              color="gray"
            />
          </div>

          <button
            onClick={handleComplete}
            disabled={completeSession.isPending}
            className="w-full max-w-xs rounded-md bg-brand-green px-6 py-3 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {completeSession.isPending ? 'Completing...' : 'Complete Session'}
          </button>
        </div>
      ) : currentItem ? (
        /* Current check item */
        <div className="flex flex-1 flex-col">
          <div className="flex-1 p-4 md:p-8">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-brand-gray">
              Item {answeredCount + 1} of {totalItems}
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">{currentItem.name}</h2>
            {currentItem.description && (
              <p className="mb-6 text-sm text-brand-gray">{currentItem.description}</p>
            )}

            {/* Notes input */}
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                placeholder="Add observation notes..."
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t border-gray-200 p-4 md:px-8">
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit('pass')}
                disabled={submitResponse.isPending}
                className="flex-1 rounded-md bg-brand-green px-4 py-3 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                Pass
              </button>
              <button
                onClick={() => handleSubmit('fail')}
                disabled={submitResponse.isPending}
                className="flex-1 rounded-md bg-brand-red px-4 py-3 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                Fail
              </button>
              <button
                onClick={() => handleSubmit('na')}
                disabled={submitResponse.isPending}
                className="rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-brand-gray hover:bg-gray-50 disabled:opacity-50"
              >
                N/A
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: 'green' | 'red' | 'gray';
}) {
  const styles = {
    green: 'bg-brand-green-light text-brand-green',
    red: 'bg-brand-red-light text-brand-red',
    gray: 'bg-brand-gray-light text-brand-gray',
  };

  return (
    <div className="text-center">
      <div className={`rounded-full px-3 py-1 text-lg font-bold ${styles[color]}`}>{count}</div>
      <p className="mt-1 text-xs text-brand-gray">{label}</p>
    </div>
  );
}
