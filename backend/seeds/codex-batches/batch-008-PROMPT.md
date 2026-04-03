# Growth Map Codex Batch 8

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 88edbc2c-c927-4f71-9179-f6e2d1886ef1 | Cherwell | E07000177 | South East | ENGLAND |
| bc9d43a6-2bc0-4037-8bfe-2ff5e657c160 | Cheshire West and Chester | E06000050 | North West | ENGLAND |
| bc34f0f3-2116-4264-8840-e806a29b7cba | East Devon | E07000040 | South West | ENGLAND |
| 6b3bdaf4-2dc0-4491-b5ec-ef9426d998fc | Gravesham | E07000109 | South East | ENGLAND |
| f81f5051-60cc-47d8-aa4c-c7b98bfa74af | Harborough | E07000131 | East Midlands | ENGLAND |
| be6ef521-de3f-4f4c-8789-a17e67a3a905 | Maidstone | E07000110 | South East | ENGLAND |
| 24bcacf3-12ba-4d90-8502-646007e983ed | New Forest | E07000091 | South East | ENGLAND |
| 87427552-d71f-47f8-9329-5edf90d6af12 | North Kesteven | E07000139 | East Midlands | ENGLAND |
| 6efae1bf-b2cc-4638-b91c-2a80d407c9a2 | Basingstoke and Deane | E07000084 | South East | ENGLAND |
| 7cd0b671-8334-47f0-bcee-a2ffa243b813 | Forest of Dean | E07000080 | South West | ENGLAND |
| 68c43f8b-b4b6-4aee-b567-95fc988b6078 | Oldham | E08000004 | North West | ENGLAND |
| 129ae05e-849f-4e94-8dfb-46eb4da97f83 | Rotherham | E08000018 | Yorkshire and the Humber | ENGLAND |
| d5a915ae-2b4f-4d3f-98ce-364ebc2a1e87 | Charnwood | E07000130 | East Midlands | ENGLAND |
| 17eb048e-c268-4b5a-b80b-92469c4efa3d | West Devon | E07000047 | South West | ENGLAND |
| 0dad54f9-8dab-4f70-9a8e-0f6e7cf768c0 | Malvern Hills | E07000235 | West Midlands | ENGLAND |
| 75d44285-e9d2-4622-936b-4036a76da7d0 | Buckinghamshire | E06000060 | South East | ENGLAND |
| 8657c8e6-ce23-40e6-9055-8b88c395525e | Barking and Dagenham | E09000002 | London | ENGLAND |
| 8d33ba9e-f1cb-489c-a7fa-83e2c53b1ce2 | East Cambridgeshire | E07000009 | East of England | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-008.json`.
