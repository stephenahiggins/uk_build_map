# Growth Map Codex Batch 14

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 915008de-38ff-4771-ab2b-fa5efaacb74c | Ipswich | E07000202 | East of England | ENGLAND |
| 09d21c64-b66f-445b-bdc8-451819759789 | Lewes | E07000063 | South East | ENGLAND |
| d25e8559-1e76-43ec-8d85-ad2bb9b5196d | Spelthorne | E07000213 | South East | ENGLAND |
| 3314cd16-0cc0-485f-a181-f269151d20a4 | Oadby and Wigston | E07000135 | East Midlands | ENGLAND |
| fa88a510-40c0-4c85-b1cf-5d96f5a2fb2b | Liverpool | E08000012 | North West | ENGLAND |
| 84371d60-45d9-4dc3-a0e9-423ceb3c90ef | West Northamptonshire | E06000062 | East Midlands | ENGLAND |
| 1795b1c7-413a-444c-a9d3-30661cdf7ec9 | Ealing | E09000009 | London | ENGLAND |
| 2abc46ad-bb04-4cc4-8c75-840422b41ce3 | Mid Suffolk | E07000203 | East of England | ENGLAND |
| 08dbbc19-7ecf-41af-ba5f-c324e8c6da65 | Lambeth | E09000022 | London | ENGLAND |
| 4212bbed-8db0-4254-8477-908fbac7ccbf | Plymouth | E06000026 | South West | ENGLAND |
| c207efea-0c63-426d-98d6-c8baee48e656 | Fenland | E07000010 | East of England | ENGLAND |
| 332aa2ed-bb95-45e0-a548-5bb2caf8c5f6 | Greenwich | E09000011 | London | ENGLAND |
| 46a55cc5-6a96-41ac-8398-423f26511831 | Uttlesford | E07000077 | East of England | ENGLAND |
| 10dd16a9-49ca-45a6-b344-63bae1021561 | Kingston upon Hull, City of | E06000010 | Yorkshire and the Humber | ENGLAND |
| 4bb74bfa-a03e-424f-9b82-74e5adbb23d2 | St Albans | E07000240 | East of England | ENGLAND |
| 9bf7def2-da4b-4906-8de5-d6fb7c9b6570 | Dudley | E08000027 | West Midlands | ENGLAND |
| fcc7d3c8-0128-45b7-9f31-9c6bdc209cca | Newcastle upon Tyne | E08000021 | North East | ENGLAND |
| bbcdedd5-a1fa-4555-94e4-7bc38591a29d | Bromley | E09000006 | London | ENGLAND |

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

Save the JSON array to `seeds/codex-batches/out/batch-014.json`.
