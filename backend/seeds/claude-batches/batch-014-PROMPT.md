# Growth MAP — seed batch 14

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 6d909733-2d4c-45f4-838c-bbbd3577e8cd | Wirral | E08000015 | Unassigned | ENGLAND |
| 32d9f262-14b8-40d9-be66-260afe1ec33c | Woking | E07000217 | Unassigned | ENGLAND |
| 291f15d8-fca2-41ba-8b3f-0259a8fbcff3 | Wokingham | E06000041 | Unassigned | ENGLAND |
| 84546d10-3514-4002-b391-93ee787d4c5f | Wolverhampton | E08000031 | Unassigned | ENGLAND |
| b905e93e-1918-4ff8-b1af-e13ccabd7b68 | Worcester | E07000237 | Unassigned | ENGLAND |
| 3988df7a-9b26-431a-a710-84f4641a4e7b | Worthing | E07000229 | Unassigned | ENGLAND |
| 2bc5e6ac-fa4e-476d-a18e-dc61b02c48ea | Wychavon | E07000238 | Unassigned | ENGLAND |
| 6f34243b-9c71-47a7-bafd-3b077c0e8730 | Wyre | E07000128 | Unassigned | ENGLAND |
| 39c841e8-274c-4a3d-b0ce-ff7218c2c6c3 | Wyre Forest | E07000239 | Unassigned | ENGLAND |
| f6040ad0-c71e-404a-a786-556eaa80f7f9 | York | E06000014 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-014.json` (create the `out` folder if needed).
