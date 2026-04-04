# Growth Map Codex Batch 17

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| c7768962-56cd-4510-a2ce-0069322984f0 | Luton | E06000032 | East of England | ENGLAND |
| e33bf613-cde9-4964-9498-3789c9454360 | Kirklees | E08000034 | Yorkshire and the Humber | ENGLAND |
| df6cbde2-ce09-4567-a4bf-c6f5b08524e5 | King's Lynn and West Norfolk | E07000146 | East of England | ENGLAND |
| 6bd33e35-4bc1-45d1-8ccc-3bff8fdebd3d | Cambridge | E07000008 | East of England | ENGLAND |
| 8ce20ee0-fde4-4acf-9c26-32c471dab770 | Oxford | E07000178 | South East | ENGLAND |
| 414e7c46-6756-491a-b12d-c705f016670c | Birmingham | E08000025 | West Midlands | ENGLAND |
| 2d82ae18-5429-475c-b3dc-210df969ffc8 | Westminster | E09000033 | London | ENGLAND |
| d0af0b17-b849-47fd-b9bb-9e8644bf9254 | Leeds | E08000035 | Yorkshire and the Humber | ENGLAND |

## Scope

- Find verifiable infrastructure, regeneration, transport, utilities, civic estate, or flood-resilience projects.
- Also look for obvious named sites and destination-led schemes inside each authority: heritage assets, landmarks, visitor attractions, waterfronts, stations, ports, town-centre gateways, major roads, hospitals, campuses, and world-heritage or nationally significant sites.
- Include projects led by councils, combined authorities, arm's-length bodies, National Highways, Network Rail, the Planning Inspectorate/DCO process, or central government where the project is physically located in the listed authority.
- Do not stop at generic council search terms. For each authority, explicitly try site-led searches such as "<authority> tunnel", "<authority> station redevelopment", "<authority> bypass", "<authority> town deal", "<authority> levelling up", "<authority> heritage restoration", "<authority> castle", "<authority> waterfront", "<authority> museum", "<authority> market hall", "<authority> world heritage", and "<authority> planning inspectorate".
- Prioritise projects that would be obvious to a local resident or reporter, including controversial or delayed schemes, not just live procurements.
- Prefer official local authority, combined authority, Planning Inspectorate, Contracts Finder, Find a Tender, or reputable local news sources.
- Prioritise projects with evidence from the last 24 months.
- Do not invent URLs or citations.

## Search Heuristics

- Start broad, then narrow to named sites. If an authority has a famous place, search the place name directly rather than relying only on the authority name.
- Prefer the most specific project title you can evidence, for example a named road scheme, station redevelopment, harbour programme, castle restoration, or tunnel proposal.
- Capture nationally significant projects that sit within a local authority boundary even if the sponsoring body is national rather than local.
- If multiple sources discuss the same obvious site, consolidate them into one project with stronger evidence instead of emitting several near-duplicates.
- Where a project is high-profile but stalled, litigated, or awaiting consent, keep it and set status/statusRationale accordingly.

## Output

Return only a JSON array. Each object should include:

- `id`
- `title`
- `description`
- `type`
- `regionId`
- `localAuthorityId`
- `createdById` = `1`
- `status`
- `statusRationale`
- `latitude`, `longitude`, `locationDescription`, `locationSource`, `locationConfidence` when supported by evidence
- `evidence`: array with `type`, `title`, `source`, `url`, `datePublished`, `summary`

Save the JSON array to `seeds/codex-batches/out/batch-017.json`.
