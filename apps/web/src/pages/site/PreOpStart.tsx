import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCheckItems, useCreateSession } from '../../hooks/use-preop';

export default function PreOpStart() {
  const { orgSlug, siteSlug, areaId } = useParams<{
    orgSlug: string;
    siteSlug: string;
    areaId: string;
  }>();
  const navigate = useNavigate();
  const { data: items, isLoading } = useCheckItems(areaId);
  const createSession = useCreateSession();
  const [shift, setShift] = useState<'am' | 'pm' | 'night' | null>(null);

  const handleStart = async () => {
    if (!areaId) return;
    const session = await createSession.mutateAsync({
      facility_area_id: areaId,
      shift,
    });
    navigate(`/${orgSlug}/sites/${siteSlug}/pre-op-checks/${session.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:min-h-0">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-4 md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-2 flex items-center gap-1 text-sm text-brand-gray hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Start Pre-op Check</h1>
      </div>

      <div className="flex-1 p-4 md:p-8">
        {/* Shift selector */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">Shift (optional)</label>
          <div className="flex gap-2">
            {(['am', 'pm', 'night'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setShift(shift === s ? null : s)}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  shift === s
                    ? 'border-brand-green bg-brand-green-light text-brand-green'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Check items preview */}
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-gray-700">
            Check Items ({items?.length ?? 0})
          </h2>
          {isLoading ? (
            <p className="text-sm text-brand-gray">Loading items...</p>
          ) : !items?.length ? (
            <p className="text-sm text-brand-gray">No check items configured for this area.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {items.map((item, i) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-brand-gray">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-brand-gray">{item.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Start button */}
      <div className="border-t border-gray-200 p-4 md:px-8">
        <button
          onClick={handleStart}
          disabled={createSession.isPending || !items?.length}
          className="w-full rounded-md bg-brand-green px-4 py-3 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50 md:w-auto"
        >
          {createSession.isPending ? 'Starting...' : `Start Check (${items?.length ?? 0} items)`}
        </button>
      </div>
    </div>
  );
}
