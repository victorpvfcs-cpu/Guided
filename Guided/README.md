# Guided

Guided is an open Chrome Manifest V3 extension for in-app training, digital adoption, workflow recording, and step-by-step guidance. It runs over existing web applications and helps people complete repeatable processes without requiring the application to be rewritten.

Guided uses portable JSON workflows. A workflow can be recorded, edited, saved locally, exported, loaded from a URL, or served through a trusted gateway backed by S3, Backblaze B2, Azure Blob Storage, or another object store.

## Features

- Records clicks, text entry, dropdown selection, date selection, and form interactions.
- Uses semantic fingerprints instead of relying only on fragile DOM positions.
- Supports stable IDs, names, labels, ARIA attributes, test attributes, text, and CSS fallbacks.
- Provides a persistent right-hand sidebar with Record and Playback tabs.
- Highlights active targets with a spotlight and directional arrow.
- Advances after mouse clicks, dropdown selection, date selection, committed input, or a short typing pause.
- Accepts any date selected in a calendar instead of replaying the recorded date.
- Validates required values before progression.
- Supports tokenized values such as `${email}`.
- Imports, edits, saves, exports, and loads workflows without redeploying the extension.

## How it works

The extension has three runtime layers:

1. Content scripts observe the page, record interactions, resolve targets, validate fields, and render the isolated sidebar.
2. The player walks through workflow steps, focuses the active field, highlights it, and advances after the interaction is complete.
3. The Manifest V3 service worker persists workflows and communicates with trusted remote storage gateways.

The sidebar appears automatically on supported pages and stays active while the user chooses an action or plays a workflow.

### Record tab

The Record tab contains the complete control surface:

- Start and stop recording
- Play the saved workflow
- Export a workflow to Downloads
- Import a workflow JSON file
- Edit workflow name, description, and JSON
- Save edits with read-after-write verification
- Configure local or remote storage
- Load a workflow from an HTTPS URL
- Save a workflow to a trusted remote gateway

### Playback tab

The Playback tab displays the active step, target spotlight, directional arrow, validation feedback, and completion state. Clicks complete click steps; dropdowns and calendars complete after a real selection; text fields advance after completion or a short typing pause. Enter and Continue remain available as fallbacks.

## Installation

Guided is currently distributed as an unpacked developer extension.

1. Download or clone this repository.
2. Open Chrome and visit `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository directory.
6. Open a supported web page. The Guided sidebar should appear automatically.

Chrome does not allow extensions to inject into every browser-owned page, including most `chrome://` pages, the Chrome Web Store, and some PDF or browser-internal views.

## Recording and playback

1. Open the target application.
2. Choose **Record a workflow** in the sidebar’s Record tab.
3. Perform the process normally.
4. Text fields are recorded without a separate click step.
5. Dropdown instructions say only “Select an option”; the recorded option is not required later.
6. Calendar steps accept any date and do not reuse the date selected during recording.
7. Choose **Stop recording**. The workflow is saved to `chrome.storage.local` and verified by reading it back.
8. Rename, edit, import, or export the workflow as needed.
9. Choose **Play saved workflow** from either tab.

Older workflows containing a click immediately before an input or dropdown step are normalized during playback so learners do not advance through the same field twice.

## Element matching

Guided checks these signals in order: `data-testid`, `data-qa`, `data-cy`, stable IDs, associated labels, nested labels, role/ARIA combinations, form names and tags, `aria-label`, `placeholder`, `title`, `alt`, value attributes, visible text, and a resilient CSS fallback.

Generated React, Angular, Ember, hash, and numeric IDs are not treated as stable references. Closed shadow roots and cross-origin iframe contents require cooperation from the host application.

## Workflow JSON

The full schema is in [`schemas/workflow.schema.json`](schemas/workflow.schema.json). A minimal step looks like this:

```json
{
  "stepIndex": 1,
  "actionType": "input",
  "instruction": "Enter a value in Email.",
  "injectData": "${email}",
  "autoPilot": false,
  "elementFingerprint": {
    "tagName": "input",
    "name": "email",
    "cssFallback": "input[name=\"email\"]"
  },
  "validation": {
    "rule": "not_empty",
    "errorMessage": "Please complete this field."
  }
}
```

Supported action types are `click`, `input`, `select`, `hover`, and `verify`. Validation rules include `not_empty`, `exact_match`, `regex`, `numeric_range`, `element_exists`, and `element_hidden`.

## Storage providers

The extension never needs cloud secret keys. Use a trusted HTTPS gateway that authenticates the user and returns workflow data or short-lived presigned URLs. The gateway can use Amazon S3, Backblaze B2’s S3-compatible API, Azure Blob Storage, another object store, a database, or an ordinary application API.

Recommended gateway responsibilities include authentication, tenant isolation, schema validation, short-lived upload/download URLs, CORS restrictions, audit events, rate limits, and secret protection. Example routes are `GET /api/workflows/:id`, `PUT /api/workflows/:id`, `POST /api/workflows/presign-upload`, and `POST /api/workflows/presign-download`.

See [`storage/storage-adapter.js`](storage/storage-adapter.js), [`storage/server-adapter.example.js`](storage/server-adapter.example.js), and [`docs/INSTRUCTIONS.md`](docs/INSTRUCTIONS.md).

## Repository layout

`manifest.json` contains the MV3 configuration. `background/` contains the service worker. `content/` contains recording, resolution, validation, injection, playback, and sidebar code. `popup/` contains optional popup controls. `storage/` contains gateway contracts. `schemas/` contains the workflow schema. `examples/` contains sample workflows. `qa/` contains the virtual UAT harness. `docs/` contains operating instructions and QA documentation.

## Development and testing

No package manager is required for the current starter. With Deno installed, run:

```bash
deno check background/service-worker.js content/*.js popup/popup.js storage/*.js qa/uat_virtual_users.js
deno run --allow-read --allow-write qa/uat_virtual_users.js
```

The UAT harness simulates 50 user profiles, 14 journeys per profile, and workflow save/load round trips. The current suite covers 754 checks, including legacy tags, semantic references, injection behavior, and persistence.

Before publishing, manually test modern SPAs, legacy server-rendered applications, native/custom dropdowns, native/custom calendars, generated IDs, CSP restrictions, nested/cross-origin iframes, open/closed shadow roots, and restricted browser pages.

## Security and privacy

The manifest currently requests broad page access because Guided is designed to work inside arbitrary web applications. Before organizational deployment or Chrome Web Store publication:

- Narrow `host_permissions` to approved domains where possible.
- Add authentication and tenant isolation to the gateway.
- Do not store passwords, secrets, payment data, or unnecessary personal data in workflows.
- Review recorded values before exporting or sharing.
- Add a privacy and retention policy.
- Review CSP and supply-chain risks.

## Current limitations

Guided is a functional open starter, not a hosted enterprise control plane. SmartTips, video embeds, hover-specific authoring, and advanced analytics are not yet implemented. Native OS-level date pickers cannot be visually styled or inspected by an extension, although recorded dates are not replayed. Cross-origin iframe DOM and closed shadow roots are inaccessible without host cooperation.

## Contributing

Issues and pull requests are welcome. Useful contributions include browser integration tests, locator strategies, accessibility improvements, storage gateways, workflow authoring, SmartTips, analytics, documentation, and translations. Include the scenario addressed and update the relevant schema, instructions, or QA coverage.

## License

Guided is released under the MIT License. See [`LICENSE`](LICENSE).
