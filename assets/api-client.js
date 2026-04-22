/**
 * 前端呼叫 Cloudflare Worker API 的 client
 * 設定儲存在 localStorage，由 admin.html 設定
 */

const API_CONFIG_KEY = 'bread_api_config';

function loadApiConfig() {
  try {
    return JSON.parse(localStorage.getItem(API_CONFIG_KEY)) || {};
  } catch (e) { return {}; }
}

function saveApiConfig(cfg) {
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(cfg));
}

function getApiBase() {
  return loadApiConfig().workerUrl || '';
}

function getAdminToken() {
  return loadApiConfig().adminToken || '';
}

function isApiConfigured() {
  const cfg = loadApiConfig();
  return !!(cfg.workerUrl && cfg.adminToken);
}

async function apiCall(path, method = 'GET', body = null) {
  const base = getApiBase();
  if (!base) throw new Error('Worker URL not configured. 請至 admin.html 設定。');

  const url = base.replace(/\/$/, '') + path;
  const headers = { 'Content-Type': 'application/json' };
  const token = getAdminToken();
  if (token) headers['X-Admin-Token'] = token;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data;
  try { data = await res.json(); }
  catch (e) { data = { error: await res.text() }; }

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const LineApi = {
  config: loadApiConfig,
  saveConfig: saveApiConfig,
  isConfigured: isApiConfigured,

  health() { return apiCall('/api/health'); },
  getMembers() { return apiCall('/api/members'); },
  getStats() { return apiCall('/api/stats'); },
  push(userId, text) { return apiCall('/api/push', 'POST', { userId, text }); },
  broadcast(text) { return apiCall('/api/broadcast', 'POST', { text }); }
};
