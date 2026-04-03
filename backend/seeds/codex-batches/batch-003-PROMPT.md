# Growth Map Codex Batch 3

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 860739d8-e2a7-4dea-b4cd-a90584c29031 | South Oxfordshire | E07000179 | South East | ENGLAND |
| 04b84554-6687-4755-852d-df78aadcdc31 | Stockport | E08000007 | North West | ENGLAND |
| c029a725-1c3e-431f-8dd3-d37c0af1755f | Telford and Wrekin | E06000020 | West Midlands | ENGLAND |
| 2331c02a-6411-44c3-a795-128e08e9ee6d | West Lancashire | E07000127 | North West | ENGLAND |
| 78d875a9-73b6-4a30-b7b7-36b77a2bd359 | West Oxfordshire | E07000181 | South East | ENGLAND |
| b905e93e-1918-4ff8-b1af-e13ccabd7b68 | Worcester | E07000237 | West Midlands | ENGLAND |
| 3295781f-4494-4519-9479-002e6017a2cd | Bexley | E09000004 | London | ENGLAND |
| eab1fa0f-b6fd-4f3c-8230-f74d48588035 | Bury | E08000002 | North West | ENGLAND |
| 99ed5a23-a490-40e5-bfc9-369398a40844 | Fylde | E07000119 | North West | ENGLAND |
| 684166e5-794a-45e7-9b24-5ce898db4715 | Hart | E07000089 | South East | ENGLAND |
| 3d764659-b3e6-4d0b-bc56-8ac1e07e3aaf | Kensington and Chelsea | E09000020 | London | ENGLAND |
| f192e426-9f23-4f03-a5be-08aa7e0a3699 | Maldon | E07000074 | Unassigned | ENGLAND |
| b472768f-ae31-4358-b378-ddd3b9c41051 | North Warwickshire | E07000218 | West Midlands | ENGLAND |
| 91fe8b17-0c86-4f0e-9518-342da911a301 | South Kesteven | E07000141 | East Midlands | ENGLAND |
| b287a159-9b3d-4d7e-a635-a0eb98650e2d | Three Rivers | E07000102 | East of England | ENGLAND |
| 6d909733-2d4c-45f4-838c-bbbd3577e8cd | Wirral | E08000015 | North West | ENGLAND |
| 1344add6-5fe2-4e68-9a6f-8300a0238d83 | Rushmoor | E07000092 | South East | ENGLAND |
| e40fd0f5-a7d8-43c3-8b8a-e9b26d13fca9 | Wealden | E07000065 | South East | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-003.json`.
