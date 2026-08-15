const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

export interface DirectoryRecord {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  district: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  rating: number | null;
  ratingCount: number | null;
}

export interface DirectoryBucket {
  status: 'completed';
  places: DirectoryRecord[];
  total: number;
  governorate: string;
  city: string;
}

export interface PendingRegion {
  governorate: string;
  city: string;
  status: 'pending' | 'processing' | 'failed';
  progress?: {
    elapsed_seconds: number;
    estimated_total_seconds: number;
    percentage: number;
    eta_seconds: number;
    eta_formatted: string;
  };
}

export type DirectoryFetchResult =
  | {
      success: true;
      status: 'completed';
      query: string;
      data: Record<string, Record<string, DirectoryBucket>>;
      total_places: number;
      total_combinations: number;
    }
  | {
      success: true;
      status: 'pending';
      query: string;
      message: string;
      pending_combinations: PendingRegion[];
      processing_combinations: PendingRegion[];
      total_combinations: number;
    }
  | {
      success: true;
      status: 'partial';
      query: string;
      data: Record<string, Record<string, DirectoryBucket>>;
      pending_combinations: PendingRegion[];
      processing_combinations: PendingRegion[];
      total_available: number;
      total_pending: number;
      total_processing: number;
      total_combinations: number;
      total_places: number;
    };

export interface RegionIndex {
  governorates: Record<string, string>; // arabic_name (lowercase) → region code
  governorate_cities: Record<string, string[]>; // region code → city names[]
}

export async function getRegionIndex(): Promise<RegionIndex | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/governorates-cities`);
    if (!res.ok) return null;
    const body = await res.json() as { success: boolean; data: RegionIndex };
    return body.success ? body.data : null;
  } catch {
    return null;
  }
}

async function directoryFetch(path: string, governorates: string[], cities: string[], query: string): Promise<DirectoryFetchResult> {
  const params = new URLSearchParams();
  params.set('query', query);
  governorates.forEach(g => params.append('governorate', g));
  cities.forEach(c => params.append('city', c));

  const res = await fetch(`${BASE_URL}${path}?${params}`);

  if (!res.ok && res.status !== 202 && res.status !== 206) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<DirectoryFetchResult>;
}

export function fetchDirectory(query: string, governorates: string[], cities: string[]): Promise<DirectoryFetchResult> {
  return directoryFetch('/api/v1/places', governorates, cities, query);
}

export function peekDirectory(query: string, governorates: string[], cities: string[]): Promise<DirectoryFetchResult> {
  return directoryFetch('/api/v1/places/check', governorates, cities, query);
}
