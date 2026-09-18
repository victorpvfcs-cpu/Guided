# Guided QA report

Date: 2026-09-17

## Verification performed

- Parsed every JSON file successfully.
- Confirmed every content-script and background path referenced by `manifest.json` exists.
- Ran `deno check` on every JavaScript file; no syntax/type-check errors were reported.
- Performed a line-by-line review of all 124 original lines, then re-reviewed the repaired files.
- Traced recording, popup, background persistence, import, remote load, resolver, validator, injector, overlay, and player flows.
- Ran `qa/uat_virtual_users.js`: 50 distinct virtual personas, 14 journeys each, plus 50 saved-document round trips and 4 injector checks: 754 checks, 754 passed, 0 failed.

## Edge-case matrix

| # | Case | Result |
|---:|---|---|
| 1 | Missing active tab | Pass: popup reports an error. |
| 2 | Active tab has no ID | Pass: rejected by `tab()`. |
| 3 | Chrome internal page | Pass: send-message error is surfaced. |
| 4 | Restricted PDF page | Pass: send-message error is surfaced. |
| 5 | Content script not injected yet | Review: reload/open target tab before use. |
| 6 | Start recording twice | Pass: second click stops/restarts state predictably. |
| 7 | Stop without starting | Pass: produces an empty workflow safely. |
| 8 | Popup closes during recording | Pass: recording state lives in the content script; stop from a reopened popup. |
| 9 | Recording click on Guided overlay | Pass: ignored by recorder. |
| 10 | Recording click on nested child | Pass: records the event target. |
| 11 | Empty input change | Pass: records `not_empty` validation. |
| 12 | Input with no name | Pass: uses label or generic field wording. |
| 13 | Dynamic element ID | Pass: ID is omitted from fingerprint. |
| 14 | Stable element ID | Pass: ID is retained. |
| 15 | Test ID present | Pass: test ID is retained and prioritized. |
| 16 | Test ID contains CSS punctuation | Pass: `CSS.escape` is used. |
| 17 | Label with `for` association | Pass: associated label is resolved. |
| 18 | Nested label | Pass: ancestor label is resolved. |
| 19 | Missing label | Pass: resolver falls back. |
| 20 | Element inside body root | Pass: CSS path is created. |
| 21 | Element is hidden | Pass: visibility check rejects it. |
| 22 | Element has zero dimensions | Pass: visibility check rejects it. |
| 23 | Element has `display:none` | Pass: visibility check rejects it. |
| 24 | Element appears after SPA mutation | Pass: `MutationObserver` retries. |
| 25 | Element never appears | Pass: timeout rejects after 7 seconds. |
| 26 | Invalid CSS fallback | Pass: selector exception is caught. |
| 27 | Missing fingerprint | Pass: resolver returns null. |
| 28 | Missing CSS fallback | Pass: resolver returns null if other traits fail. |
| 29 | Exact match with number expected value | Pass: normalized to string. |
| 30 | Blank `not_empty` value | Pass: invalid. |
| 31 | Invalid regex | Pass: returns a validation error instead of throwing. |
| 32 | Regex empty pattern | Pass: valid JavaScript regex behavior. |
| 33 | Numeric NaN | Pass: invalid. |
| 34 | Numeric min boundary | Pass: inclusive boundary. |
| 35 | Numeric max boundary | Pass: inclusive boundary. |
| 36 | Numeric value outside range | Pass: invalid. |
| 37 | `element_exists` with null | Pass: invalid. |
| 38 | `element_hidden` with visible element | Pass: invalid. |
| 39 | Missing validation object | Pass: valid by default. |
| 40 | Missing custom error message | Pass: fallback message is used. |
| 41 | Placeholder token exists | Pass: interpolated. |
| 42 | Placeholder token missing | Pass: original token remains visible. |
| 43 | Multiple placeholder tokens | Pass: all are replaced. |
| 44 | Input prototype setter exists | Pass: native setter is used. |
| 45 | Input prototype setter missing | Pass: direct assignment fallback exists. |
| 46 | Framework input events | Pass: input/change/blur are dispatched. |
| 47 | Overlay text contains HTML | Pass: repaired overlay uses `textContent`. |
| 48 | Missing overlay handler | Pass: button safely becomes inert. |
| 49 | Local storage provider | Pass: workflow is read from `chrome.storage.local`. |
| 50 | Unsupported storage method/header injection | Pass: method is allow-listed and caller headers are ignored. |
| 51 | Missing remote endpoint | Pass: clear configuration error. |
| 52 | Remote HTTP error | Pass: status is returned in the error. |
| 53 | Remote invalid JSON | Pass: error is caught and returned. |
| 54 | Remote URL uses non-HTTP scheme | Pass: popup rejects it. |
| 55 | Malformed imported JSON | Pass: popup reports invalid JSON. |
| 56 | Empty imported file | Pass: JSON parse error is reported. |
| 57 | Workflow has no saved steps | Pass: player shows completion. |
| 58 | Workflow step cannot resolve | Pass: player shows a safe failure message. |
| 59 | Workflow missing `globalInjections` | Pass: injector defaults to an empty object. |
| 60 | Workflow schema missing required fields | Pass: schema now requires non-empty core fields and step indexes >= 1. |

## Findings fixed during QA

1. Recording completion was only posted to the page and was never persisted. It now sends `RECORDING_COMPLETE` to the service worker, which saves the workflow.
2. Overlay content used `innerHTML` with workflow-controlled text. It now uses `textContent` and fixed DOM nodes.
3. Invalid regular expressions could crash validation. They now return a controlled validation failure.
4. `element_hidden` was not implemented. It is now supported.
5. Remote storage accepted caller-provided headers and arbitrary methods. Methods are now allow-listed and custom headers are ignored.
6. Popup operations lacked active-tab and `runtime.lastError` handling. These paths now report usable errors.
7. Remote URL input accepted arbitrary schemes. It now requires `http` or `https`.
8. The workflow schema was too permissive. Core strings, step indexes, fingerprint fields, and unknown properties are now constrained.

## Product improvements applied from UAT feedback

- Added a workflow editor for names, descriptions, and JSON-level step edits.
- Added import, verified local save, export-to-Downloads, remote load, and remote save controls.
- Added provider configuration for local storage, API gateway, Amazon S3, Backblaze B2, and Azure Blob through a gateway-only model.
- Fixed popup-to-content messaging so recording and playback commands actually reach the content script.
- Added persistent recording-state recovery when the popup is reopened.
- Added target highlighting, step progress, and optional `autoPilot` injection during playback.
- Fixed the playback `Illegal invocation` error by calling native setters with `setter.call(element, value)` and added support for select, checkbox/radio, and contenteditable targets.
- Replaced the bottom-right transient guide card with a persistent full-height in-page sidebar.
- Added player-level injection error recovery so a failed fill can be retried without losing the workflow.
- Made the sidebar appear immediately on page load with Record and Play choices, and kept those choices available after completion.
- Changed input recording to ignore the initial click on form controls and to advance on Enter after a value is entered.
- Moved the popup feature set into the permanent sidebar's Record tab and added a dedicated Playback tab for active playback.
- Removed the required input/Enter command from input-step guidance; input steps now auto-advance after change or a short typing pause and focus the next field, with Continue/Enter retained only as fallbacks.
- Added dedicated `select` steps that request an option without recording or displaying a prescribed value, allowed any non-empty calendar date, and skipped legacy click-before-input steps to prevent double advancement.
- Added event and value-change watching for native and custom dropdown/calendar widgets so playback advances as soon as a real selection is present.
- Made calendar fingerprints and injected data date-agnostic, including compatibility with older workflows that recorded an exact date or enabled auto-fill.
- Added calendar-surface detection for custom date pickers and moved the spotlight to the month/grid surface; legacy recorded date state is cleared before date selection.
- Expanded fingerprints and resolution for legacy tags, role/ARIA combinations, titles, alt text, values, visible text, labels, and all three common test attributes.

## Remaining release blockers

- A live Chrome install test should be run on a normal HTTPS page, a SPA, a page with a CSP, and a restricted page.
- The extension still needs a production workflow editor; recording currently persists the generated workflow but does not expose editing or naming controls.
- The storage gateway, authentication, tenant isolation, CORS policy, and presigned URL implementation are examples only.
- The player still does not implement hover/select actions, SmartTips, or video embeds from the original blueprint.
- SVG icons may need conversion to PNG for the target Chrome publishing pipeline if Chrome Web Store validation rejects them.
- Automated browser tests and a dependency-based JSON Schema validator should be added before production release.
