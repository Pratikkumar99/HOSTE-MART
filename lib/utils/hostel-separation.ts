// lib/utils/hostel-separation.ts
export interface HostelUser {
  id: string;
  hostel_type: 'boys' | 'girls';
  business_id?: string;
}

export interface SeparatedContent {
  businesses: any[];
  products: any[];
  requests: any[];
  sales: any[];
}

export function filterByHostelType<T extends { hostel_type?: string; owner_hostel_type?: string }>(
  items: T[],
  userHostelType: 'boys' | 'girls'
): T[] {
  return items.filter(item => {
    // If item has hostel_type directly (like businesses)
    if (item.hostel_type) {
      return item.hostel_type === userHostelType;
    }
    // If item has owner_hostel_type (like products, requests)
    if (item.owner_hostel_type) {
      return item.owner_hostel_type === userHostelType;
    }
    // If no hostel info, don't show (safety first)
    return false;
  });
}

export function canViewContent(
  contentHostelType: 'boys' | 'girls' | 'both',
  userHostelType: 'boys' | 'girls'
): boolean {
  if (contentHostelType === 'both') {
    return true; // 'both' means visible to everyone
  }
  return contentHostelType === userHostelType;
}

export function getHostelSpecificPath(
  basePath: string,
  userHostelType: 'boys' | 'girls'
): string {
  return `${basePath}?hostel=${userHostelType}`;
}

export function validateHostelAccess(
  userHostelType: 'boys' | 'girls',
  targetHostelType: 'boys' | 'girls' | 'both'
): boolean {
  if (targetHostelType === 'both') return true;
  return userHostelType === targetHostelType;
}
