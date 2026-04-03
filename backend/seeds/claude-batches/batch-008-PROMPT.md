# Growth MAP — seed batch 8

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 16483efb-f5b8-40b7-a5ee-92de3bb4daf4 | Mid Sussex | E07000228 | Unassigned | ENGLAND |
| 65ca3a9a-2d96-465c-bb8c-355d59246c6c | Middlesbrough | E06000002 | Unassigned | ENGLAND |
| 41cb4145-8c3b-4bf4-a4fb-139f173b7b80 | Milton Keynes | E06000042 | Unassigned | ENGLAND |
| 0018cde8-819c-4320-ae8c-0a1ac18dd344 | Mole Valley | E07000210 | Unassigned | ENGLAND |
| 24bcacf3-12ba-4d90-8502-646007e983ed | New Forest | E07000091 | Unassigned | ENGLAND |
| de278ff3-97fd-4e36-9d36-498aaf3de9e8 | Newark and Sherwood | E07000175 | Unassigned | ENGLAND |
| fcc7d3c8-0128-45b7-9f31-9c6bdc209cca | Newcastle upon Tyne | E08000021 | Unassigned | ENGLAND |
| 4c223c00-c1eb-43d7-9c49-0e05626166bf | Newcastle-under-Lyme | E07000195 | Unassigned | ENGLAND |
| 3ef6ec68-3e98-4bee-8136-31abee8d9ce3 | Newham | E09000025 | Unassigned | ENGLAND |
| 3c6b3bd7-4b20-473e-9760-149830f49231 | North Devon | E07000043 | Unassigned | ENGLAND |
| 54481931-acce-441c-ad13-792953123fc5 | North East Derbyshire | E07000038 | Unassigned | ENGLAND |
| cef65a66-6ad5-444b-9f9e-64813743fbf2 | North East Lincolnshire | E06000012 | Unassigned | ENGLAND |
| 82b718ba-034c-41ff-beea-0631e38c5efe | North Hertfordshire | E07000099 | Unassigned | ENGLAND |
| 87427552-d71f-47f8-9329-5edf90d6af12 | North Kesteven | E07000139 | Unassigned | ENGLAND |
| 8f566f13-8281-4167-8a26-eff47173c4b6 | North Lincolnshire | E06000013 | Unassigned | ENGLAND |
| 455ee169-1b26-48ec-bb4c-e27f54121c08 | North Norfolk | E07000147 | Unassigned | ENGLAND |
| d78a5e12-ade7-47dd-8fee-deead8981365 | North Northamptonshire | E06000061 | Unassigned | ENGLAND |
| eb713df5-5ed3-4ec7-be9a-ab8b8d0373dd | North Somerset | E06000024 | Unassigned | ENGLAND |
| d951ce9f-7115-411c-965c-102e236b37d1 | North Tyneside | E08000022 | Unassigned | ENGLAND |
| b472768f-ae31-4358-b378-ddd3b9c41051 | North Warwickshire | E07000218 | Unassigned | ENGLAND |
| 15541f0a-5a34-489d-a3c5-7841be2f3ab2 | North West Leicestershire | E07000134 | Unassigned | ENGLAND |
| 26181f9a-8e89-4fef-8923-1e0ff3fecc12 | North Yorkshire | E06000065 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-008.json` (create the `out` folder if needed).
