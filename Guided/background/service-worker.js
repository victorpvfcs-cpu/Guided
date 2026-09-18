const DEFAULTS = { workflow: null, storage: { provider: 'local', endpoint: '', bucket: '', container: '', prefix: '' } };

chrome.runtime.onInstalled.addListener(() => chrome.storage.local.get(DEFAULTS, value => chrome.storage.local.set(value)));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RECORDING_STATUS') {
    chrome.storage.local.set({ recordingTabId: message.active ? sender.tab?.id ?? null : null }).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === 'RECORDING_STATUS_GET') {
    chrome.storage.local.get('recordingTabId').then(({ recordingTabId }) => sendResponse({ ok: true, active: Number.isInteger(recordingTabId), tabId: recordingTabId ?? null }));
    return true;
  }
  if (message.type === 'RECORDING_COMPLETE' && message.workflow) {
    const check = validateWorkflow(message.workflow);
    if (!check.ok) { sendResponse(check); return false; }
    chrome.storage.local.set({ workflow: message.workflow }).then(() => chrome.storage.local.get('workflow')).then(({ workflow }) => sendResponse({ ok: workflow?.workflowId === message.workflow.workflowId, workflow })).catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message.type === 'WORKFLOW_SAVE') {
    const check = validateWorkflow(message.workflow);
    if (!check.ok) { sendResponse(check); return false; }
    chrome.storage.local.set({ workflow: message.workflow }).then(() => chrome.storage.local.get('workflow')).then(({ workflow }) => sendResponse({ ok: workflow?.workflowId === message.workflow.workflowId, workflow })).catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message.type === 'LOAD_WORKFLOW_URL') {
    fetch(message.url).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(workflow => { const check = validateWorkflow(workflow); if (!check.ok) throw new Error(check.error); return chrome.storage.local.set({ workflow }).then(() => chrome.storage.local.get('workflow')).then(({ workflow: saved }) => ({ ok: saved?.workflowId === workflow.workflowId, workflow: saved })); })
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message.type === 'STORAGE_REQUEST') {
    chrome.storage.local.get(DEFAULTS).then(({ storage }) => fetchStorage(storage, message)).then(sendResponse).catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (message.type === 'STORAGE_CONFIG_SAVE') {
    const config = message.config || {};
    if (!['local', 'api', 's3', 'backblaze', 'azure'].includes(config.provider)) { sendResponse({ ok: false, error: 'Unsupported storage provider.' }); return false; }
    chrome.storage.local.set({ storage: { provider: config.provider, endpoint: String(config.endpoint || '').trim(), bucket: String(config.bucket || '').trim(), container: String(config.container || '').trim(), prefix: String(config.prefix || '').trim() } }).then(() => sendResponse({ ok: true })).catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message.type === 'WORKFLOW_SAVE_REMOTE') {
    const check = validateWorkflow(message.workflow); if (!check.ok) { sendResponse(check); return false; }
    chrome.storage.local.get(DEFAULTS).then(({ storage }) => { if (!storage.endpoint) throw new Error('Configure a trusted storage/API endpoint first.'); return fetch(storage.endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message.workflow) }); }).then(response => { if (!response.ok) throw new Error(`Remote save returned HTTP ${response.status}`); return chrome.storage.local.set({ workflow: message.workflow }); }).then(() => sendResponse({ ok: true })).catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});

function validateWorkflow(workflow) {
  if (!workflow || typeof workflow !== 'object') return { ok: false, error: 'Workflow must be an object.' };
  if (!workflow.workflowId || !workflow.workflowName || !workflow.targetUrlPattern || !Array.isArray(workflow.steps)) return { ok: false, error: 'Workflow is missing required fields.' };
  const actions = new Set(['click', 'input', 'select', 'hover', 'verify']);
  for (const [index, step] of workflow.steps.entries()) if (!step || step.stepIndex !== index + 1 || !actions.has(step.actionType) || !step.instruction || !step.elementFingerprint?.tagName || !step.elementFingerprint?.cssFallback) return { ok: false, error: 'Workflow contains an invalid step.' };
  return { ok: true };
}

async function fetchStorage(config, message) {
  if (config.provider === 'local') return { ok: true, workflow: (await chrome.storage.local.get('workflow')).workflow };
  if (!config.endpoint) throw new Error('Configure a trusted storage/API endpoint first.');
  const method = ['GET', 'POST', 'PUT', 'DELETE'].includes(message.method) ? message.method : 'GET';
  const response = await fetch(config.endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(message.body ?? {}) });
  if (!response.ok) throw new Error(`Storage endpoint returned HTTP ${response.status}`);
  return { ok: true, data: await response.json() };
}
