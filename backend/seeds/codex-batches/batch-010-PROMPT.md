# Growth Map Codex Batch 10

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| bc246478-db44-4c02-960d-150ab71d3489 | Tendring | E07000076 | East of England | ENGLAND |
| e3bdde60-ea37-41f7-8d12-9cc4cf638269 | Blackburn with Darwen | E06000008 | North West | ENGLAND |
| b473e5d1-c527-4a0a-bee1-1c33f8e2dcef | East Hampshire | E07000085 | South East | ENGLAND |
| 6bc0c4b9-2b38-4cae-b800-87874214b5c2 | Havant | E07000090 | Unassigned | ENGLAND |
| f743ffc1-562d-46b6-9cb8-037945f214c1 | Bedford | E06000055 | East of England | ENGLAND |
| fed86ed5-9e42-484a-b5ac-4ef62f89ede9 | Lewisham | E09000023 | London | ENGLAND |
| 501d6b6e-95b6-499b-8919-716b7279b3b9 | Stockton-on-Tees | E06000004 | North East | ENGLAND |
| 5494ba48-d1d8-423a-ba0c-02ebf4a01583 | Westmorland and Furness | E06000064 | North West | ENGLAND |
| 407fd101-ad0e-478b-8d24-c05523cb01de | Winchester | E07000094 | South East | ENGLAND |
| e9f58529-27d0-4f0e-b356-af551db11db7 | Cannock Chase | E07000192 | West Midlands | ENGLAND |
| 7184fc2b-ecd8-490e-865e-170a913d8697 | Chichester | E07000225 | South East | ENGLAND |
| 0356dfcd-5214-4e70-a247-027613d0779e | Cornwall | E06000052 | South West | ENGLAND |
| 55a6a888-b4fd-4c08-862a-5193175639cc | Derby | E06000015 | East Midlands | ENGLAND |
| f6040ad0-c71e-404a-a786-556eaa80f7f9 | York | E06000014 | Yorkshire and the Humber | ENGLAND |
| 2e5d0cc7-ccef-46a8-8b4c-43847d55590c | Babergh | E07000200 | East of England | ENGLAND |
| 4355cf65-9905-4235-8b4e-a825ee60e029 | Hounslow | E09000018 | London | ENGLAND |
| d78a5e12-ade7-47dd-8fee-deead8981365 | North Northamptonshire | E06000061 | East Midlands | ENGLAND |
| fdd05462-2dff-4fae-b2fa-9b266bc309ad | Rochford | E07000075 | East of England | ENGLAND |

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

Return only a JSON array in your final message. Do not write files. Each object should include:

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
