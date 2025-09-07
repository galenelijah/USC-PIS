# Health Information & Campaigns

Base path: `/api/health-info/`

Routers

- `health-information` → General health content
- `campaigns` → HealthCampaigns (with images)
- `campaign-resources` → Attachments/resources for campaigns
- `campaign-feedback` → Feedback on campaigns

Key endpoints (examples)

- List health info: `GET /api/health-info/health-information/`
- Campaigns CRUD: `GET|POST /api/health-info/campaigns/`
- Campaign item: `GET|PATCH /api/health-info/campaigns/{id}/`
- Campaign resources: `GET|POST /api/health-info/campaign-resources/`
- Campaign feedback: `GET|POST /api/health-info/campaign-feedback/`

Notes

- Image uploads may be skipped when Cloudinary is not configured; warnings are logged and surfaced.
- Server validates file sizes (banner/thumbnail/pubmat) and total upload size.
- Frontend surfaces featured campaigns and health info content in dashboards.

