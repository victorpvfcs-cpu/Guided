# Guided instructions

1. Open Chrome and visit `chrome://extensions`.
2. Enable Developer mode, choose **Load unpacked**, and select this folder.
3. Open a target site and click the Guided extension icon.
4. Start recording, perform the learner actions, then stop recording. Guided now saves the workflow to extension storage and performs a read-after-write verification.
5. Reopen the popup to edit the workflow name, description, or JSON, then choose **Save edits**. Use **Export saved workflow** for a portable file.
6. Import a JSON workflow from disk or load one from an HTTPS URL, then choose **Play saved workflow**. The player highlights each target and shows step progress.

## Connecting storage

Use a small authenticated service with endpoints such as `GET /api/workflows/:id`, `PUT /api/workflows/:id`, `POST /api/workflows/presign-upload`, and `POST /api/workflows/presign-download`. Select the provider in the popup and enter only the HTTPS gateway URL. The service may use AWS S3, Backblaze B2's S3-compatible API, Azure Blob Storage, or another provider. Configure the gateway with the CORS allow-list, authentication method, workflow tenant, and object prefix.

Do not put AWS access keys, Backblaze application keys, Azure account keys, or SAS-generation credentials in this repository or in `manifest.json`.

## Production checklist

- Add authentication, tenant isolation, audit logs, rate limits, and CSP review.
- Validate imported workflows against `schemas/workflow.schema.json`.
- Add automated tests for resolver fallbacks and validation rules.
- Replace placeholder icons and add a privacy policy before publishing.
- Test real Chrome behavior on legacy pages, nested iframes, CSP-restricted apps, and shadow-root components.
