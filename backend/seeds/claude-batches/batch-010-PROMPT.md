# Growth MAP — seed batch 10

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 8a75c1ed-7176-4dba-803c-e03aaeea310e | Rother | E07000064 | Unassigned | ENGLAND |
| 129ae05e-849f-4e94-8dfb-46eb4da97f83 | Rotherham | E08000018 | Unassigned | ENGLAND |
| 20509f09-89e9-4ccf-a48b-f36af473e37c | Rugby | E07000220 | Unassigned | ENGLAND |
| 5308ed4d-331a-49ef-b207-e0dbd90130d1 | Runnymede | E07000212 | Unassigned | ENGLAND |
| 47f68eb2-2bd2-4740-9ff6-d5b8437f453b | Rushcliffe | E07000176 | Unassigned | ENGLAND |
| 1344add6-5fe2-4e68-9a6f-8300a0238d83 | Rushmoor | E07000092 | Unassigned | ENGLAND |
| 19becee2-f033-432c-8680-77ab35773e74 | Rutland | E06000017 | Unassigned | ENGLAND |
| f9e5f7df-73a6-47ad-a033-4ff9199ee374 | Salford | E08000006 | Unassigned | ENGLAND |
| ef751ea7-5965-4415-9e1e-f84dfe31d207 | Sandwell | E08000028 | Unassigned | ENGLAND |
| b6363a2d-dd76-4bc4-b220-a333fe3cce0e | Sefton | E08000014 | Unassigned | ENGLAND |
| a0087b01-90e7-45ed-8563-f065eb387081 | Sevenoaks | E07000111 | Unassigned | ENGLAND |
| c8342b98-d53e-4234-b1a5-3103487c2009 | Sheffield | E08000019 | Unassigned | ENGLAND |
| 1a8a9bca-852d-4a65-8574-54cf638079b5 | Shropshire | E06000051 | Unassigned | ENGLAND |
| 14085765-b2f6-4bde-9ea5-6f7ae0dbba30 | Slough | E06000039 | Unassigned | ENGLAND |
| c43f0394-ce3e-44bd-b757-872975fd6cd2 | Solihull | E08000029 | Unassigned | ENGLAND |
| ebc3c1e0-496e-4ae6-a066-5d6f3d65a565 | Somerset | E06000066 | Unassigned | ENGLAND |
| 6161bc31-3a78-42d3-88b6-d87511894f49 | South Cambridgeshire | E07000012 | Unassigned | ENGLAND |
| 31455f7b-45c1-43a5-98ef-9c65fd7472ca | South Derbyshire | E07000039 | Unassigned | ENGLAND |
| 594ce1a6-620d-427d-902a-d84b7e921ac1 | South Gloucestershire | E06000025 | Unassigned | ENGLAND |
| 3a6d9613-ba44-4884-826e-4dd5a898d1ce | South Hams | E07000044 | Unassigned | ENGLAND |
| 0f33e97f-93e5-4f97-b690-b2731f378c3a | South Holland | E07000140 | Unassigned | ENGLAND |
| 91fe8b17-0c86-4f0e-9518-342da911a301 | South Kesteven | E07000141 | Unassigned | ENGLAND |

## Output format

Return **only** a JSON **array** (no markdown fences, no commentary). Each element must be one project object suitable for `scripts/seedProjectsFromFile.ts`:

- `id`: unique string (e.g. slug or UUID).
- `title`, `description`, `type`: usually `LOCAL_GOV` for council schemes (or `REGIONAL_GOV` / `NATIONAL_GOV` if truly regional/national).
- `regionId`, `localAuthorityId`: **must** match one of the rows above for the authority the project belongs to.
- `createdById`: `1`.
- `status`: `GREEN`, `AMBER`, or `RED` from cited reporting.
- `statusRationale`: short, grounded in evidence.
- `latitude`, `longitude`, `locationDescription`, `locationSource`, `locationConfidence` when you can cite a site.
- `evidence`: array of objects with `type` (`URL` for links), `title`, `source`, `url` (real http(s) only), `datePublished` (ISO date), `summary`.

## Rules

1. **Do not invent URLs.** Every `url` must be a real page you could open.
2. If you cannot find solid projects for an authority, **omit** that authority rather than guessing.
3. Prefer official `.gov.uk` council sources, combined authorities, or reputable national/local press.
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-010.json` (create the `out` folder if needed).
