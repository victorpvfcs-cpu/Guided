# Guided instructions

1. Open Chrome and visit `chrome://extensions`.
2. Enable Developer mode, choose **Load unpacked**, and select this folder.
3. Open a target site. The persistent Guided bar appears on the right automatically; it is also available from the extension popup.
4. Use the **Record** tab for the complete control set: start/stop recording, play saved workflow, export/import, workflow editing, and storage settings. Form-control clicks are not recorded as separate steps.
5. Reopen the popup to edit the workflow name, description, or JSON, then choose **Save edits**. Use **Export saved workflow** for a portable file.
6. Import a JSON workflow from disk or load one from an HTTPS URL, then choose **Play saved workflow** in the Record tab or **Playback** tab. Dropdown steps say only to select an option and do not prescribe the option. Calendar/date steps accept any selected date and watch for picker updates even when the calendar does not emit a normal change event. Input steps automatically advance after the value is committed or the user pauses typing; the next field is focused and ready. Enter and Continue remain available as fallbacks.

## Connecting storage

Use a small authenticated service with endpoints such as `GET /api/workflows/:id`, `PUT /api/workflows/:id`, `POST /api/workflows/presign-upload`, and `POST /api/workflows/presign-download`. Select the provider in the popup and enter only the HTTPS gateway URL. The service may use AWS S3, Backblaze B2's S3-compatible API, Azure Blob Storage, or another provider. Configure the gateway with the CORS allow-list, authentication method, workflow tenant, and object prefix.

Do not put AWS access keys, Backblaze application keys, Azure account keys, or SAS-generation credentials in this repository or in `manifest.json`.

## Production checklist

- Add authentication, tenant isolation, audit logs, rate limits, and CSP review.
- Validate imported workflows against `schemas/workflow.schema.json`.
- Add automated tests for resolver fallbacks and validation rules.
- Replace placeholder icons and add a privacy policy before publishing.
- Test real Chrome behavior on legacy pages, nested iframes, CSP-restricted apps, and shadow-root components.
