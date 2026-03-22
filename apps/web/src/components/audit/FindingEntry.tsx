import { useState } from 'react';
import { useGenerateFinding, useCreateFinding } from '../../hooks/use-audits';
import { useSite } from '../../hooks/use-site';

interface FindingEntryProps {
  auditId: string;
  onCreated: () => void;
}

type Step = 'input' | 'generating' | 'review';

export function FindingEntry({ auditId, onCreated }: FindingEntryProps) {
  const { site } = useSite();
  const generateFinding = useGenerateFinding();
  const createFinding = useCreateFinding();

  const [step, setStep] = useState<Step>('input');
  const [observation, setObservation] = useState('');
  const [error, setError] = useState<string | null>(null);

  // AI-generated data for review
  const [generated, setGenerated] = useState<{
    classification: {
      category_code: string;
      confidence: number;
      risk_rating: string;
      keywords_matched: string[];
    };
    narrative: {
      finding_title: string;
      finding_narrative: string;
      recommended_action: string;
      clause_refs: Array<{
        framework_code: string;
        clause_ref: string;
        gap_detected: boolean;
        gap_description: string | null;
        capa_urgency: string | null;
      }>;
    };
  } | null>(null);

  // Editable fields during review
  const [title, setTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const [action, setAction] = useState('');
  const [riskRating, setRiskRating] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [confidence, setConfidence] = useState(0);

  const handleGenerate = async () => {
    if (!observation.trim() || !site) return;
    setError(null);
    setStep('generating');

    try {
      const result = await generateFinding.mutateAsync({
        raw_observation: observation,
        site_id: site.id,
        site_type: site.site_type,
      });

      setGenerated(result);
      setTitle(result.narrative.finding_title);
      setNarrative(result.narrative.finding_narrative);
      setAction(result.narrative.recommended_action);
      setRiskRating(result.classification.risk_rating);
      setCategoryCode(result.classification.category_code);
      setConfidence(result.classification.confidence);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI generation failed');
      setStep('input');
    }
  };

  const handleSave = async () => {
    try {
      await createFinding.mutateAsync({
        audit_id: auditId,
        raw_observation: observation,
        category_code: categoryCode,
        finding_title: title,
        finding_narrative: narrative,
        recommended_action: action,
        risk_rating: riskRating as 'critical' | 'high' | 'medium' | 'low',
        ai_confidence: confidence,
        clause_refs: generated?.narrative.clause_refs ?? [],
      });

      // Reset
      setObservation('');
      setGenerated(null);
      setStep('input');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save finding');
    }
  };

  const riskColors: Record<string, string> = {
    critical: 'bg-brand-red-light text-brand-red border-brand-red',
    high: 'bg-brand-red-light text-brand-red border-brand-red/50',
    medium: 'bg-brand-amber-light text-brand-amber border-brand-amber',
    low: 'bg-brand-green-light text-brand-green border-brand-green',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Step: Input */}
      {step === 'input' && (
        <div className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Add Finding</h3>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={3}
            placeholder="Describe the observation (e.g. 'Bait station #4 behind loading dock found damaged with no bait present. Evidence of rodent droppings nearby.')"
            className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          {error && (
            <div className="mb-3 rounded-md bg-brand-red-light p-2 text-sm text-brand-red">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={!observation.trim()}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              Generate with AI
            </button>
          </div>
        </div>
      )}

      {/* Step: Generating */}
      {step === 'generating' && (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          <p className="text-sm font-medium text-gray-900">Analysing observation...</p>
          <p className="text-xs text-brand-gray">Step 1: Classification, Step 2: Narrative</p>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && generated && (
        <div className="divide-y divide-gray-100">
          {/* Classification header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${riskColors[riskRating] ?? ''}`}>
                {riskRating}
              </span>
              <span className="text-xs text-brand-gray">
                {categoryCode.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="text-xs text-brand-gray">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>

          {/* Editable fields */}
          <div className="p-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Narrative</label>
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Recommended Action
              </label>
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Risk Rating</label>
              <select
                value={riskRating}
                onChange={(e) => setRiskRating(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Clause refs */}
          {generated.narrative.clause_refs.length > 0 && (
            <div className="px-4 py-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                Mapped Clauses
              </h4>
              <div className="space-y-1.5">
                {generated.narrative.clause_refs.map((ref, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs"
                  >
                    <span className="shrink-0 font-mono font-medium text-brand-blue">
                      [{ref.framework_code}] {ref.clause_ref}
                    </span>
                    {ref.gap_detected && (
                      <span className="shrink-0 rounded bg-brand-red-light px-1.5 py-0.5 text-brand-red">
                        gap
                      </span>
                    )}
                    {ref.gap_description && (
                      <span className="text-brand-gray">{ref.gap_description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 px-4 py-3">
            <button
              onClick={handleSave}
              disabled={createFinding.isPending}
              className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {createFinding.isPending ? 'Saving...' : 'Save Finding'}
            </button>
            <button
              onClick={() => {
                setStep('input');
                setGenerated(null);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
