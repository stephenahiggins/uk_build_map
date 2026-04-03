# Growth MAP — seed batch 1

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 68b15a6a-4fef-4c8e-af8e-42b21fab15f5 | Adur | E07000223 | Unassigned | ENGLAND |
| 9878daec-1cee-4b83-a68e-ce03d8b1d2de | Amber Valley | E07000032 | Unassigned | ENGLAND |
| 4b50870d-6c3a-4878-bc51-d13eb7b443fa | Arun | E07000224 | Unassigned | ENGLAND |
| 311939d0-af21-4e6b-adbe-14f6b57b15a8 | Ashfield | E07000170 | Unassigned | ENGLAND |
| 3537dd5a-0b7e-4775-b7dd-3342d54de939 | Ashford | E07000105 | Unassigned | ENGLAND |
| 2e5d0cc7-ccef-46a8-8b4c-43847d55590c | Babergh | E07000200 | Unassigned | ENGLAND |
| 8657c8e6-ce23-40e6-9055-8b88c395525e | Barking and Dagenham | E09000002 | Unassigned | ENGLAND |
| 5ac3471e-3804-4aa6-93ae-e20f0806ce27 | Barnet | E09000003 | Unassigned | ENGLAND |
| ae2526bd-34ae-489f-a153-bcbdeca3f463 | Barnsley | E08000016 | Unassigned | ENGLAND |
| f34a541e-702a-4cf2-92a9-eb6660ad8483 | Basildon | E07000066 | Unassigned | ENGLAND |
| 6efae1bf-b2cc-4638-b91c-2a80d407c9a2 | Basingstoke and Deane | E07000084 | Unassigned | ENGLAND |
| 29e30f64-1b2e-4e30-9959-b90c23b7807a | Bassetlaw | E07000171 | Unassigned | ENGLAND |
| 5d6ab247-42b5-4f3a-8aef-227771b99e68 | Bath and North East Somerset | E06000022 | Unassigned | ENGLAND |
| f743ffc1-562d-46b6-9cb8-037945f214c1 | Bedford | E06000055 | Unassigned | ENGLAND |
| 3295781f-4494-4519-9479-002e6017a2cd | Bexley | E09000004 | Unassigned | ENGLAND |
| 414e7c46-6756-491a-b12d-c705f016670c | Birmingham | E08000025 | Unassigned | ENGLAND |
| 1d315c4c-7ac6-4fa3-a378-db6108e709bf | Blaby | E07000129 | Unassigned | ENGLAND |
| e3bdde60-ea37-41f7-8d12-9cc4cf638269 | Blackburn with Darwen | E06000008 | Unassigned | ENGLAND |
| 0871ae5f-12f0-4fdd-a225-31464ca0a2ae | Blackpool | E06000009 | Unassigned | ENGLAND |
| 7cacddfe-642c-423a-82f6-bca2c378799a | Bolsover | E07000033 | Unassigned | ENGLAND |
| e21e1cf3-bcd3-4e79-ac36-9caef4b2f05e | Bolton | E08000001 | Unassigned | ENGLAND |
| 3696dbbc-1ac8-4b07-b1fc-0dbf1b09801f | Boston | E07000136 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-001.json` (create the `out` folder if needed).
