import { Place, PlaceType } from '@/types';
import { DirectoryRecord, RegionIndex } from '@/lib/api/directory';

const QUERY_TO_TYPE: Record<string, PlaceType> = {
  'صيدلية': 'pharmacy',
  'pharmacy': 'pharmacy',
  'ماركت': 'supermarket',
  'سوبرماركت': 'supermarket',
  'supermarket': 'supermarket',
  'مخبز': 'bakery',
  'bakery': 'bakery',
  'ملابس': 'clinic',
  'clinic': 'clinic',
  'كافيه': 'cafe',
  'cafe': 'cafe',
  'مطعم': 'restaurant',
  'restaurant': 'restaurant',
};

// Transform the /api/v1/governorates-cities response into the shape DataScreen expects.
// Keys in the region index are the canonical Arabic names used for validation —
// we must preserve them exactly so fetchDirectory() can send names the backend will accept.
export function buildRegionMap(data: RegionIndex): {
  governorates: string[];
  cities: Record<string, string[]>;
} {
  const governorates: string[] = [];
  const cities: Record<string, string[]> = {};

  for (const [name, code] of Object.entries(data.governorates)) {
    const cityList = data.governorate_cities[code] ?? [];
    if (cityList.length > 0) {
      governorates.push(name);
      cities[name] = cityList;
    }
  }

  governorates.sort((a, b) => a.localeCompare(b, 'ar'));
  return { governorates, cities };
}

export function queryToPlaceType(query: string): PlaceType {
  return QUERY_TO_TYPE[query.trim()] ?? 'other';
}

export function mapRecord(
  record: DirectoryRecord,
  placeType: PlaceType,
  governorate: string,
  city: string
): Place {
  return {
    id: record.id,
    name: record.name,
    type: placeType,
    governorate,
    city,
    address: record.address ?? undefined,
    lat: record.lat,
    lng: record.lng,
    phone: record.phone ?? undefined,
    website: record.website ?? undefined,
    rating: record.rating ?? undefined,
    ratingCount: record.ratingCount ?? undefined,
    status: 'new',
    isImportant: false,
    createdAt: new Date().toISOString(),
  };
}
