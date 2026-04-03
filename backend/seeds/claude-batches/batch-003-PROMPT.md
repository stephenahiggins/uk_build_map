# Growth MAP — seed batch 3

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 12849c58-4a1e-41db-b3cf-b2696170e4cd | Castle Point | E07000069 | Unassigned | ENGLAND |
| fa731498-63b7-42ae-99a1-113526fb7b4b | Central Bedfordshire | E06000056 | Unassigned | ENGLAND |
| d5a915ae-2b4f-4d3f-98ce-364ebc2a1e87 | Charnwood | E07000130 | Unassigned | ENGLAND |
| 41bb52e2-1c91-4c1f-ac76-96aa169068b7 | Chelmsford | E07000070 | Unassigned | ENGLAND |
| 5d888fca-fb02-4c1d-913d-9eb1a57c32fe | Cheltenham | E07000078 | Unassigned | ENGLAND |
| 88edbc2c-c927-4f71-9179-f6e2d1886ef1 | Cherwell | E07000177 | Unassigned | ENGLAND |
| 3416b16a-946a-4bed-b1ef-d0f6bb219530 | Cheshire East | E06000049 | Unassigned | ENGLAND |
| bc9d43a6-2bc0-4037-8bfe-2ff5e657c160 | Cheshire West and Chester | E06000050 | Unassigned | ENGLAND |
| ec85a970-c47d-44d0-b364-f299c48263ec | Chesterfield | E07000034 | Unassigned | ENGLAND |
| 7184fc2b-ecd8-490e-865e-170a913d8697 | Chichester | E07000225 | Unassigned | ENGLAND |
| 5fb44e2e-f5a4-444c-86de-228564de50f6 | Chorley | E07000118 | Unassigned | ENGLAND |
| 625db3b5-baeb-42c9-9fc7-03427e0cae2d | City of London | E09000001 | Unassigned | ENGLAND |
| 5debc648-a144-4627-aac6-84e5b9973a9f | Colchester | E07000071 | Unassigned | ENGLAND |
| 0356dfcd-5214-4e70-a247-027613d0779e | Cornwall | E06000052 | Unassigned | ENGLAND |
| b6b03ea9-7fd5-47cc-83e5-cb923aa2bba2 | Cotswold | E07000079 | Unassigned | ENGLAND |
| 1f94fb79-1821-46be-b1e2-7f22bd0d7af1 | County Durham | E06000047 | Unassigned | ENGLAND |
| 861eed51-03df-41c1-bf31-c834ccb4bd5f | Coventry | E08000026 | Unassigned | ENGLAND |
| 9d25a482-0d07-49da-b6f1-521ec3ad62c5 | Crawley | E07000226 | Unassigned | ENGLAND |
| c24a9e15-f34c-4d4a-acf5-362522d5db93 | Croydon | E09000008 | Unassigned | ENGLAND |
| 7bd12193-1e9d-48e3-a51a-e66f29db6e47 | Cumberland | E06000063 | Unassigned | ENGLAND |
| dfa0cab3-b5ed-4352-8df2-0a5e42065d78 | Dacorum | E07000096 | Unassigned | ENGLAND |
| 929b6c99-e2d5-437e-ae6a-60cfb16f0060 | Darlington | E06000005 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-003.json` (create the `out` folder if needed).
