import type { SyncPushResponse } from '@/lib/api/sync.api';

const MAX_ITEMS_IN_MESSAGE = 3;

export const getSyncPushFailureMessage = (response: SyncPushResponse): string | null => {
  const failedItems = response.failed_items ?? [];
  if (failedItems.length === 0) {
    return null;
  }

  const details = failedItems
    .slice(0, MAX_ITEMS_IN_MESSAGE)
    .map((item) => {
      const reason = typeof item.error === 'string' && item.error.trim().length > 0
        ? ` (${item.error.trim()})`
        : '';
      return `${item.entity_type}:${item.id}${reason}`;
    })
    .join(', ');

  const suffix = failedItems.length > MAX_ITEMS_IN_MESSAGE ? ', ...' : '';
  return `Sync failed for ${failedItems.length} item(s): ${details}${suffix}`;
};
