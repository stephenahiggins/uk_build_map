# Growth Map Codex Batch 10

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| bc246478-db44-4c02-960d-150ab71d3489 | Tendring | E07000076 | East of England | ENGLAND |
| e3bdde60-ea37-41f7-8d12-9cc4cf638269 | Blackburn with Darwen | E06000008 | North West | ENGLAND |
| b473e5d1-c527-4a0a-bee1-1c33f8e2dcef | East Hampshire | E07000085 | South East | ENGLAND |
| 6bc0c4b9-2b38-4cae-b800-87874214b5c2 | Havant | E07000090 | Unassigned | ENGLAND |
| 501d6b6e-95b6-499b-8919-716b7279b3b9 | Stockton-on-Tees | E06000004 | North East | ENGLAND |
| f743ffc1-562d-46b6-9cb8-037945f214c1 | Bedford | E06000055 | East of England | ENGLAND |
| e9f58529-27d0-4f0e-b356-af551db11db7 | Cannock Chase | E07000192 | West Midlands | ENGLAND |
| 7184fc2b-ecd8-490e-865e-170a913d8697 | Chichester | E07000225 | South East | ENGLAND |
| fed86ed5-9e42-484a-b5ac-4ef62f89ede9 | Lewisham | E09000023 | London | ENGLAND |
| 5494ba48-d1d8-423a-ba0c-02ebf4a01583 | Westmorland and Furness | E06000064 | North West | ENGLAND |
| 407fd101-ad0e-478b-8d24-c05523cb01de | Winchester | E07000094 | South East | ENGLAND |
| f6040ad0-c71e-404a-a786-556eaa80f7f9 | York | E06000014 | Yorkshire and the Humber | ENGLAND |
| 0356dfcd-5214-4e70-a247-027613d0779e | Cornwall | E06000052 | South West | ENGLAND |
| 55a6a888-b4fd-4c08-862a-5193175639cc | Derby | E06000015 | East Midlands | ENGLAND |
| 4355cf65-9905-4235-8b4e-a825ee60e029 | Hounslow | E09000018 | London | ENGLAND |
| fdd05462-2dff-4fae-b2fa-9b266bc309ad | Rochford | E07000075 | East of England | ENGLAND |
| 56fd119b-5daa-45bf-ac3f-9bb0eb748d0c | Windsor and Maidenhead | E06000040 | South East | ENGLAND |
| 2e5d0cc7-ccef-46a8-8b4c-43847d55590c | Babergh | E07000200 | East of England | ENGLAND |

## Scope

- Find verifiable infrastructure, regeneration, transport, utilities, civic estate, or flood-resilience projects.
- Prefer official local authority, combined authority, Planning Inspectorate, Contracts Finder, Find a Tender, or reputable local news sources.
- Prioritise projects with evidence from the last 24 months.
- Do not invent URLs or citations.

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-010.json`.
