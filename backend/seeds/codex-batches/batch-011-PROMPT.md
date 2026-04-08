# Growth Map Codex Batch 11

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 56fd119b-5daa-45bf-ac3f-9bb0eb748d0c | Windsor and Maidenhead | E06000040 | South East | ENGLAND |
| 9119ac8b-0ee8-4123-a063-eff4ba04e654 | Herefordshire, County of | E06000019 | West Midlands | ENGLAND |
| bf52a64d-21cd-4601-b294-7f218f0cadc4 | Thurrock | E06000034 | East of England | ENGLAND |
| e21e1cf3-bcd3-4e79-ac36-9caef4b2f05e | Bolton | E08000001 | North West | ENGLAND |
| 36234393-4bb0-4840-838e-27fa1f6750fd | Fareham | E07000087 | South East | ENGLAND |
| 5985813f-e96e-4c66-9ce7-dc752c7ac035 | Lichfield | E07000194 | West Midlands | ENGLAND |
| 8f566f13-8281-4167-8a26-eff47173c4b6 | North Lincolnshire | E06000013 | Yorkshire and the Humber | ENGLAND |
| 3c567233-40ed-48a2-8b08-65eadf2efb09 | South Norfolk | E07000149 | East of England | ENGLAND |
| 405554dd-518f-4ff2-a895-d96048221270 | Walsall | E08000030 | West Midlands | ENGLAND |
| 4228d1cd-c9f6-4824-bb60-7656f06612a4 | Bradford | E08000032 | Yorkshire and the Humber | ENGLAND |
| 167fa00f-0939-45ce-aae4-bc2a52e23b22 | East Suffolk | E07000244 | East of England | ENGLAND |
| 9432eb2d-c60a-471d-bb68-4fcde835d0ed | Knowsley | E08000011 | North West | ENGLAND |
| 6161bc31-3a78-42d3-88b6-d87511894f49 | South Cambridgeshire | E07000012 | East of England | ENGLAND |
| 65a306aa-86ab-49c7-a9b2-3d50d232db7e | Swindon | E06000030 | South West | ENGLAND |
| b95e88d6-0f9e-4e02-8844-7d7b84748104 | Brighton and Hove | E06000043 | South East | ENGLAND |
| 291f15d8-fca2-41ba-8b3f-0259a8fbcff3 | Wokingham | E06000041 | South East | ENGLAND |
| a6f8c820-5f90-4624-8461-489a3518595e | Stroud | E07000082 | South West | ENGLAND |
| 19becee2-f033-432c-8680-77ab35773e74 | Rutland | E06000017 | East Midlands | ENGLAND |

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
