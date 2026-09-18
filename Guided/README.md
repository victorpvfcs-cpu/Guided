# Guided

Guided is a Chrome Manifest V3 digital adoption platform starter. It records semantic fingerprints, resolves elements across dynamic SPAs and legacy markup, validates steps, injects tokenized data, highlights targets, and plays portable JSON workflows. Workflows can be edited, verified on save, imported, exported, or sent through a trusted storage gateway.

## Storage providers

The browser extension supports local JSON, a remote workflow URL, or a trusted storage gateway. The gateway can be backed by Amazon S3, any S3-compatible service such as Backblaze B2, Azure Blob Storage, or another object store. Keep access keys and signing credentials server-side; return short-lived presigned URLs or authenticated API responses to the extension.

See `docs/INSTRUCTIONS.md`, `docs/GITHUB_SUMMARY.md`, and `storage/`.
