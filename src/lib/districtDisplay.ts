export type DistrictLookup = {
  id?: string
  code?: string
  name: string
}

const normalize = (value?: string) => (value || '').trim().toLowerCase()

export function resolveDistrictName(
  districtValue: string | undefined,
  districts: DistrictLookup[],
): string {
  const key = normalize(districtValue)
  if (!key) return '—'

  const match = districts.find((district) =>
    [district.id, district.code, district.name].some((candidate) => normalize(candidate) === key),
  )

  return match?.name || districtValue || '—'
}
