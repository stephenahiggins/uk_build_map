# Growth MAP — seed batch 7

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| e33bf613-cde9-4964-9498-3789c9454360 | Kirklees | E08000034 | Unassigned | ENGLAND |
| 9432eb2d-c60a-471d-bb68-4fcde835d0ed | Knowsley | E08000011 | Unassigned | ENGLAND |
| 08dbbc19-7ecf-41af-ba5f-c324e8c6da65 | Lambeth | E09000022 | Unassigned | ENGLAND |
| 5fcfa4b5-237f-4277-bd7d-520622031cf0 | Lancaster | E07000121 | Unassigned | ENGLAND |
| d0af0b17-b849-47fd-b9bb-9e8644bf9254 | Leeds | E08000035 | Unassigned | ENGLAND |
| fe0e49eb-12d2-47cd-872d-67ac9ee31036 | Leicester | E06000016 | Unassigned | ENGLAND |
| 09d21c64-b66f-445b-bdc8-451819759789 | Lewes | E07000063 | Unassigned | ENGLAND |
| fed86ed5-9e42-484a-b5ac-4ef62f89ede9 | Lewisham | E09000023 | Unassigned | ENGLAND |
| 5985813f-e96e-4c66-9ce7-dc752c7ac035 | Lichfield | E07000194 | Unassigned | ENGLAND |
| 45831c76-dafc-4769-8a03-85a7c1623627 | Lincoln | E07000138 | Unassigned | ENGLAND |
| fa88a510-40c0-4c85-b1cf-5d96f5a2fb2b | Liverpool | E08000012 | Unassigned | ENGLAND |
| c7768962-56cd-4510-a2ce-0069322984f0 | Luton | E06000032 | Unassigned | ENGLAND |
| be6ef521-de3f-4f4c-8789-a17e67a3a905 | Maidstone | E07000110 | Unassigned | ENGLAND |
| f192e426-9f23-4f03-a5be-08aa7e0a3699 | Maldon | E07000074 | Unassigned | ENGLAND |
| 0dad54f9-8dab-4f70-9a8e-0f6e7cf768c0 | Malvern Hills | E07000235 | Unassigned | ENGLAND |
| 0a32fab9-c39d-45f7-b09d-9bc0ef49919e | Manchester | E08000003 | Unassigned | ENGLAND |
| d8f1b9fc-ffe3-49ca-a9f7-f1059c0e965d | Mansfield | E07000174 | Unassigned | ENGLAND |
| e01658e6-54f1-4d6c-9948-0426515f110c | Medway | E06000035 | Unassigned | ENGLAND |
| f741388a-f4e2-49f5-977b-dcf17a75d0a3 | Melton | E07000133 | Unassigned | ENGLAND |
| 74b00795-04f3-4525-9481-98487a7ae43d | Merton | E09000024 | Unassigned | ENGLAND |
| b33ec5d9-8112-4793-b540-961ba09d1fc5 | Mid Devon | E07000042 | Unassigned | ENGLAND |
| 2abc46ad-bb04-4cc4-8c75-840422b41ce3 | Mid Suffolk | E07000203 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-007.json` (create the `out` folder if needed).
