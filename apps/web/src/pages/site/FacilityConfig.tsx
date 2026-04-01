import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  useFacilityAreas,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
  useReorderAreas,
  useCheckItems,
  useCreateCheckItem,
  useUpdateCheckItem,
  useDeleteCheckItem,
  useFindingCategories,
} from '../../hooks/use-facilities';

const AREA_TYPES = [
  { value: 'production', label: 'Production' },
  { value: 'storage', label: 'Storage' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'dispatch', label: 'Dispatch' },
  { value: 'external', label: 'External' },
  { value: 'equipment', label: 'Equipment' },
] as const;

const SCORING_TYPES = [
  { value: 'pass_fail', label: 'Pass / Fail' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'percentage', label: 'Percentage' },
] as const;

const CARE_LEVELS = [
  { value: 'high', label: 'High Care' },
  { value: 'medium', label: 'Medium Care' },
  { value: 'low', label: 'Low Care' },
] as const;

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'per_shift', label: 'Per Shift' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

function areaTypeBadgeColor(type: string | null): string {
  switch (type) {
    case 'production':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'storage':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case 'amenities':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'dispatch':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'external':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    case 'equipment':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
  }
}

function careLevelBadgeColor(level: string): string {
  switch (level) {
    case 'high':
      return 'bg-brand-red-light text-brand-red dark:bg-brand-red/10 dark:text-red-300';
    case 'medium':
      return 'bg-brand-amber-light text-brand-amber dark:bg-brand-amber/10 dark:text-amber-300';
    case 'low':
      return 'bg-brand-green-light text-brand-green dark:bg-brand-green/10 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
  }
}

function frequencyBadgeColor(freq: string): string {
  switch (freq) {
    case 'daily':
      return 'bg-brand-green-light text-brand-green dark:bg-brand-green/10 dark:text-green-300';
    case 'per_shift':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'weekly':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case 'monthly':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
  }
}

export default function FacilityConfig() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const { data: areas, isLoading } = useFacilityAreas();
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [showAddArea, setShowAddArea] = useState(false);

  return (
    <div>
      <PageHeader
        title="Facility Areas"
        description="Configure production zones, storage areas, and check item assignments"
        actions={
          <Link
            to={`/${orgSlug}/sites/${siteSlug}/settings`}
            className="text-sm text-brand-gray hover:text-gray-700 dark:hover:text-gray-300"
          >
            Back to Settings
          </Link>
        }
      />
      <div className="p-6 md:p-8">
        {/* Add area button */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-gray">
            Areas ({areas?.length ?? 0})
          </h2>
          <button
            onClick={() => setShowAddArea(true)}
            className="rounded-lg bg-brand-green px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-green/90 transition-colors"
          >
            + Add area
          </button>
        </div>

        {/* Inline add area form */}
        {showAddArea && (
          <AddAreaForm
            onClose={() => setShowAddArea(false)}
            existingCount={areas?.length ?? 0}
          />
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && areas && areas.length === 0 && !showAddArea && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-600 dark:bg-gray-800">
            <p className="text-sm text-brand-gray">No facility areas configured yet.</p>
            <button
              onClick={() => setShowAddArea(true)}
              className="mt-3 text-sm font-medium text-brand-green hover:text-brand-green/80"
            >
              Add your first area
            </button>
          </div>
        )}

        {/* Area list */}
        {areas && areas.length > 0 && (
          <AreaList
            areas={areas}
            expandedAreaId={expandedAreaId}
            onToggleExpand={(id) =>
              setExpandedAreaId(expandedAreaId === id ? null : id)
            }
          />
        )}
      </div>
    </div>
  );
}

// ── Add area form ────────────────────────────────────────────────────────

function AddAreaForm({
  onClose,
  existingCount,
}: {
  onClose: () => void;
  existingCount: number;
}) {
  const createArea = useCreateArea();
  const [name, setName] = useState('');
  const [areaType, setAreaType] = useState<string>('');
  const [careLevel, setCareLevel] = useState<string>('medium');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createArea.mutate(
      {
        name: name.trim(),
        area_type: areaType || null,
        care_level: careLevel as 'high' | 'medium' | 'low',
        display_order: existingCount,
      },
      {
        onSuccess: () => {
          setName('');
          setAreaType('');
          setCareLevel('medium');
          onClose();
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-brand-green/30 bg-brand-green-light/10 p-4 dark:border-brand-green/20 dark:bg-brand-green/5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Area name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kill Floor, Boning Room"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            autoFocus
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <select
            value={areaType}
            onChange={(e) => setAreaType(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select type</option>
            {AREA_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Care level
          </label>
          <select
            value={careLevel}
            onChange={(e) => setCareLevel(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {CARE_LEVELS.map((cl) => (
              <option key={cl.value} value={cl.value}>
                {cl.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={createArea.isPending || !name.trim()}
            className="rounded-md bg-brand-green px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-green/90 disabled:opacity-50 transition-colors"
          >
            {createArea.isPending ? 'Adding...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
      {createArea.isError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {createArea.error.message}
        </p>
      )}
    </form>
  );
}

// ── Area list with reorder ───────────────────────────────────────────────

interface AreaWithCount {
  id: string;
  name: string;
  area_type: string | null;
  care_level: string;
  display_order: number;
  check_item_count: number;
  site_id: string;
  organisation_id: string;
  is_active: boolean;
  source_document_id: string | null;
  created_at: string;
}

function AreaList({
  areas,
  expandedAreaId,
  onToggleExpand,
}: {
  areas: AreaWithCount[];
  expandedAreaId: string | null;
  onToggleExpand: (id: string) => void;
}) {
  const reorderAreas = useReorderAreas();
  const deleteArea = useDeleteArea();
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...areas];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    const orderings = newOrder.map((a, i) => ({ id: a.id, display_order: i }));
    reorderAreas.mutate(orderings);
  }

  function handleMoveDown(index: number) {
    if (index === areas.length - 1) return;
    const newOrder = [...areas];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    const orderings = newOrder.map((a, i) => ({ id: a.id, display_order: i }));
    reorderAreas.mutate(orderings);
  }

  function handleDelete(areaId: string) {
    deleteArea.mutate(areaId, {
      onSuccess: () => setConfirmDeleteId(null),
    });
  }

  return (
    <div className="space-y-2">
      {areas.map((area, index) => (
        <div
          key={area.id}
          className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        >
          {/* Area header */}
          <div className="flex items-center gap-2 px-4 py-3">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0 || reorderAreas.isPending}
                className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-300"
                title="Move up"
              >
                <ChevronUpIcon />
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === areas.length - 1 || reorderAreas.isPending}
                className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-300"
                title="Move down"
              >
                <ChevronDownIcon />
              </button>
            </div>

            {/* Expand/collapse toggle */}
            <button
              onClick={() => onToggleExpand(area.id)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <span
                className={`transition-transform ${
                  expandedAreaId === area.id ? 'rotate-90' : ''
                }`}
              >
                <ChevronRightIcon />
              </span>
              <div className="min-w-0 flex-1">
                {editingAreaId === area.id ? null : (
                  <>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {area.name}
                    </span>
                    <span className="ml-2 text-xs text-brand-gray">
                      {area.check_item_count} item{area.check_item_count !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
              {editingAreaId !== area.id && (
                <div className="flex items-center gap-1.5">
                  {area.area_type && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${areaTypeBadgeColor(
                        area.area_type,
                      )}`}
                    >
                      {area.area_type.replace('_', ' ')}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${careLevelBadgeColor(
                      area.care_level,
                    )}`}
                  >
                    {area.care_level} care
                  </span>
                </div>
              )}
            </button>

            {/* Edit / delete buttons */}
            {editingAreaId !== area.id && (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAreaId(area.id);
                  }}
                  className="rounded p-1 text-gray-400 hover:text-brand-blue dark:hover:text-blue-400"
                  title="Edit area"
                >
                  <PencilIcon />
                </button>
                {confirmDeleteId === area.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(area.id)}
                      disabled={deleteArea.isPending}
                      className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-red-600"
                    >
                      {deleteArea.isPending ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded border border-gray-300 px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(area.id);
                    }}
                    className="rounded p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    title="Delete area"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Inline edit form */}
          {editingAreaId === area.id && (
            <EditAreaForm
              area={area}
              onClose={() => setEditingAreaId(null)}
            />
          )}

          {/* Expanded: check items */}
          {expandedAreaId === area.id && editingAreaId !== area.id && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <CheckItemSection areaId={area.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Edit area form ───────────────────────────────────────────────────────

function EditAreaForm({
  area,
  onClose,
}: {
  area: AreaWithCount;
  onClose: () => void;
}) {
  const updateArea = useUpdateArea();
  const [name, setName] = useState(area.name);
  const [areaType, setAreaType] = useState(area.area_type ?? '');
  const [careLevel, setCareLevel] = useState(area.care_level ?? 'medium');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    updateArea.mutate(
      {
        areaId: area.id,
        name: name.trim(),
        area_type: areaType || null,
        care_level: careLevel as 'high' | 'medium' | 'low',
      },
      { onSuccess: onClose },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
        </div>
        <div className="w-full sm:w-40">
          <select
            value={areaType}
            onChange={(e) => setAreaType(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">No type</option>
            {AREA_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <select
            value={careLevel}
            onChange={(e) => setCareLevel(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {CARE_LEVELS.map((cl) => (
              <option key={cl.value} value={cl.value}>
                {cl.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updateArea.isPending || !name.trim()}
            className="rounded-md bg-brand-green px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-green/90 disabled:opacity-50 transition-colors"
          >
            {updateArea.isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
      {updateArea.isError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {updateArea.error.message}
        </p>
      )}
    </form>
  );
}

// ── Check item section ───────────────────────────────────────────────────

function CheckItemSection({ areaId }: { areaId: string }) {
  const { data: items, isLoading } = useCheckItems(areaId);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gray">
          Check Items
        </h3>
        <button
          onClick={() => setShowAddItem(true)}
          className="text-xs font-medium text-brand-green hover:text-brand-green/80"
        >
          + Add item
        </button>
      </div>

      {showAddItem && (
        <CheckItemForm
          areaId={areaId}
          displayOrder={items?.length ?? 0}
          onClose={() => setShowAddItem(false)}
        />
      )}

      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      )}

      {!isLoading && items && items.length === 0 && !showAddItem && (
        <p className="py-4 text-center text-xs text-brand-gray">
          No check items yet.{' '}
          <button
            onClick={() => setShowAddItem(true)}
            className="font-medium text-brand-green hover:text-brand-green/80"
          >
            Add one
          </button>
        </p>
      )}

      {items && items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item) =>
            editingItemId === item.id ? (
              <CheckItemForm
                key={item.id}
                areaId={areaId}
                item={item}
                onClose={() => setEditingItemId(null)}
              />
            ) : (
              <CheckItemRow
                key={item.id}
                item={item}
                areaId={areaId}
                onEdit={() => setEditingItemId(item.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ── Check item row ───────────────────────────────────────────────────────

function CheckItemRow({
  item,
  areaId,
  onEdit,
}: {
  item: {
    id: string;
    name: string;
    description: string | null;
    frequency: string;
    scoring_type: string;
    category_code: string | null;
  };
  areaId: string;
  onEdit: () => void;
}) {
  const deleteItem = useDeleteCheckItem();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    deleteItem.mutate(
      { areaId, itemId: item.id },
      { onSuccess: () => setConfirmDelete(false) },
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
        {item.description && (
          <p className="mt-0.5 truncate text-xs text-brand-gray">{item.description}</p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${frequencyBadgeColor(
          item.frequency,
        )}`}
      >
        {item.frequency.replace('_', ' ')}
      </span>
      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
        {item.scoring_type.replace('_', ' / ')}
      </span>
      {item.category_code && (
        <span className="hidden shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 sm:inline-block dark:bg-blue-900/30 dark:text-blue-300">
          {item.category_code.replace(/_/g, ' ')}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onEdit}
          className="rounded p-1 text-gray-400 hover:text-brand-blue dark:hover:text-blue-400"
          title="Edit item"
        >
          <PencilIcon />
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleteItem.isPending}
              className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-red-600"
            >
              {deleteItem.isPending ? '...' : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded border border-gray-300 px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            title="Delete item"
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Check item form (create/edit) ────────────────────────────────────────

interface CheckItemFormItem {
  id: string;
  name: string;
  description: string | null;
  scoring_type: string;
  frequency: string;
  category_code: string | null;
}

function CheckItemForm({
  areaId,
  item,
  displayOrder,
  onClose,
}: {
  areaId: string;
  item?: CheckItemFormItem;
  displayOrder?: number;
  onClose: () => void;
}) {
  const createItem = useCreateCheckItem();
  const updateItem = useUpdateCheckItem();
  const { data: categories } = useFindingCategories();
  const isEditing = !!item;

  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [scoringType, setScoringType] = useState(item?.scoring_type ?? 'pass_fail');
  const [frequency, setFrequency] = useState(item?.frequency ?? 'daily');
  const [categoryCode, setCategoryCode] = useState(item?.category_code ?? '');

  const isPending = createItem.isPending || updateItem.isPending;
  const error = createItem.error ?? updateItem.error;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing) {
      updateItem.mutate(
        {
          areaId,
          itemId: item.id,
          name: name.trim(),
          description: description.trim() || null,
          scoring_type: scoringType,
          frequency,
          category_code: categoryCode || null,
        },
        { onSuccess: onClose },
      );
    } else {
      createItem.mutate(
        {
          areaId,
          name: name.trim(),
          description: description.trim() || null,
          scoring_type: scoringType,
          frequency,
          category_code: categoryCode || null,
          display_order: displayOrder ?? 0,
        },
        {
          onSuccess: () => {
            setName('');
            setDescription('');
            setScoringType('pass_fail');
            setFrequency('daily');
            setCategoryCode('');
            onClose();
          },
        },
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-2 rounded-lg border border-brand-blue/20 bg-brand-blue-light/10 p-3 dark:border-blue-500/20 dark:bg-blue-900/10"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Floor drains clear, Metal detector operational"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details for the operator"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
          />
        </div>

        {/* Scoring type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Scoring type
          </label>
          <select
            value={scoringType}
            onChange={(e) => setScoringType(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {SCORING_TYPES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Frequency */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category code */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Finding category
          </label>
          <select
            value={categoryCode}
            onChange={(e) => setCategoryCode(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">None</option>
            {(categories ?? []).map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-brand-gray">
            Links this check item to compliance framework clauses via the selected category.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="rounded-md bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : isEditing ? 'Update' : 'Add item'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error.message}</p>
      )}
    </form>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────

function ChevronUpIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
