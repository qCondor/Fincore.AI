export type DateGroup = 'Today' | 'Yesterday' | 'Last 7 days' | 'Older';

export interface GroupedItems<T> {
  label: DateGroup;
  items: T[];
}

export function groupByDate<T>(
  items: T[],
  getTimestamp: (item: T) => string | Date
): GroupedItems<T>[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groups: Record<DateGroup, T[]> = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    Older: [],
  };

  for (const item of items) {
    const timestamp = getTimestamp(item);
    const itemDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const itemDay = new Date(
      itemDate.getFullYear(),
      itemDate.getMonth(),
      itemDate.getDate()
    );

    if (itemDay >= today) {
      groups['Today'].push(item);
    } else if (itemDay >= yesterday) {
      groups['Yesterday'].push(item);
    } else if (itemDay >= lastWeek) {
      groups['Last 7 days'].push(item);
    } else {
      groups['Older'].push(item);
    }
  }

  const result: GroupedItems<T>[] = [];
  const order: DateGroup[] = ['Today', 'Yesterday', 'Last 7 days', 'Older'];

  for (const label of order) {
    if (groups[label].length > 0) {
      result.push({ label, items: groups[label] });
    }
  }

  return result;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}
