# Growth MAP — seed batch 12

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 79fd5cc0-d051-4fff-b14d-2b091a17ae1f | Swale | E07000113 | Unassigned | ENGLAND |
| 65a306aa-86ab-49c7-a9b2-3d50d232db7e | Swindon | E06000030 | Unassigned | ENGLAND |
| 1782fb1e-571c-4131-882c-1852f829e384 | Tameside | E08000008 | Unassigned | ENGLAND |
| c9e5ea3e-c751-4789-bb68-580befd37617 | Tamworth | E07000199 | Unassigned | ENGLAND |
| 342d04fd-d711-44d1-811d-2dd7a28bc365 | Tandridge | E07000215 | Unassigned | ENGLAND |
| e689fd0a-47d4-496b-9d20-293836d5bae7 | Teignbridge | E07000045 | Unassigned | ENGLAND |
| c029a725-1c3e-431f-8dd3-d37c0af1755f | Telford and Wrekin | E06000020 | Unassigned | ENGLAND |
| bc246478-db44-4c02-960d-150ab71d3489 | Tendring | E07000076 | Unassigned | ENGLAND |
| c3069c84-6135-4764-8f30-cbbe22981484 | Test Valley | E07000093 | Unassigned | ENGLAND |
| 3fc2ec4a-f23a-4ef0-b677-c009c475238f | Tewkesbury | E07000083 | Unassigned | ENGLAND |
| 1fc80db5-b0c9-48f6-b8a3-c4ab3bcf5ec1 | Thanet | E07000114 | Unassigned | ENGLAND |
| b287a159-9b3d-4d7e-a635-a0eb98650e2d | Three Rivers | E07000102 | Unassigned | ENGLAND |
| bf52a64d-21cd-4601-b294-7f218f0cadc4 | Thurrock | E06000034 | Unassigned | ENGLAND |
| bb526d3d-dbca-4b62-8a9e-19f03a3b1a6b | Tonbridge and Malling | E07000115 | Unassigned | ENGLAND |
| 82cc34ae-9c27-4790-b415-124b6faf1593 | Torbay | E06000027 | Unassigned | ENGLAND |
| 04db7ce9-76cf-4ad6-ac66-c762d67cb0ee | Torridge | E07000046 | Unassigned | ENGLAND |
| 6f235cd3-f603-4c15-b42c-d567c200a3b8 | Tower Hamlets | E09000030 | Unassigned | ENGLAND |
| 2a6eb4bc-cd1f-4c14-ae0d-647ae499dfdc | Trafford | E08000009 | Unassigned | ENGLAND |
| aa18f7ef-eb31-485f-9978-0d841adc80aa | Tunbridge Wells | E07000116 | Unassigned | ENGLAND |
| 46a55cc5-6a96-41ac-8398-423f26511831 | Uttlesford | E07000077 | Unassigned | ENGLAND |
| 57fdb475-af3a-4bef-96c8-447b65bd627e | Vale of White Horse | E07000180 | Unassigned | ENGLAND |
| 0192253e-0ea6-4a2b-a195-1065b63f5acb | Wakefield | E08000036 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-012.json` (create the `out` folder if needed).
