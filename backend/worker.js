/**
 * 日月潭低碳集點・LINE Messaging API 後端
 * Cloudflare Worker 免費方案即可跑（每日 10 萬次請求）
 *
 * 路由：
 *   POST /api/webhook     ─ LINE 事件 Webhook（加好友、訊息、解除等）
 *   GET  /api/members     ─ 取得所有會員清單（需 X-Admin-Token）
 *   GET  /api/stats       ─ 會員統計（需 X-Admin-Token）
 *   POST /api/push        ─ 推送私訊 { userId, text } （需 X-Admin-Token）
 *   POST /api/broadcast   ─ 全體推播 { text } （需 X-Admin-Token）
 *   GET  /api/health      ─ 健康檢查
 *
 * 需在 Cloudflare Dashboard 設定的環境變數：
 *   LINE_CHANNEL_ACCESS_TOKEN  ─ Messaging API Channel 的長效 Token（Secret）
 *   LINE_CHANNEL_SECRET        ─ Channel Secret（驗證 Webhook 簽章用，Secret）
 *   ADMIN_TOKEN                ─ 自訂管理員密碼（前端呼叫 API 時要帶，Secret）
 *   ALLOWED_ORIGIN             ─ 允許的前端網域（預設 https://onelifegpt-tech.github.io）
 *
 * 需綁定的 KV Namespace：
 *   MEMBERS  ─ 存每位加入官方帳號的使用者 profile
 */

// ============================================
// Webhook 簽章驗證（LINE 規範）
// ============================================
async function verifyLineSignature(body, signature, channelSecret) {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return expected === signature;
}

// ============================================
// 呼叫 LINE API
// ============================================
async function lineApi(path, method, body, accessToken) {
  const res = await fetch(`https://api.line.me${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function fetchProfile(userId, accessToken) {
  const { ok, data } = await lineApi(`/v2/bot/profile/${userId}`, 'GET', null, accessToken);
  return ok ? data : null;
}

async function pushMessage(userId, messages, accessToken) {
  return lineApi('/v2/bot/message/push', 'POST', {
    to: userId,
    messages: Array.isArray(messages) ? messages : [messages]
  }, accessToken);
}

async function broadcastMessage(messages, accessToken) {
  return lineApi('/v2/bot/message/broadcast', 'POST', {
    messages: Array.isArray(messages) ? messages : [messages]
  }, accessToken);
}

// ============================================
// 處理 LINE Webhook 事件
// ============================================
async function handleWebhook(request, env) {
  const body = await request.text();
  const signature = request.headers.get('x-line-signature');

  if (env.LINE_CHANNEL_SECRET) {
    const valid = await verifyLineSignature(body, signature, env.LINE_CHANNEL_SECRET);
    if (!valid) return new Response('Invalid signature', { status: 401 });
  }

  let payload;
  try { payload = JSON.parse(body); }
  catch (e) { return new Response('Bad request', { status: 400 }); }

  const events = payload.events || [];
  for (const event of events) {
    try {
      await handleEvent(event, env);
    } catch (e) {
      console.error('Event error:', e);
    }
  }

  return new Response('OK');
}

async function handleEvent(event, env) {
  const userId = event.source?.userId;
  if (!userId) return;

  // 加好友 / 解除封鎖
  if (event.type === 'follow') {
    const profile = await fetchProfile(userId, env.LINE_CHANNEL_ACCESS_TOKEN);
    const member = {
      userId,
      displayName: profile?.displayName || '未命名旅人',
      pictureUrl: profile?.pictureUrl || null,
      statusMessage: profile?.statusMessage || '',
      followedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      status: 'active',
      points: 0,
      checkIns: 0
    };
    await env.MEMBERS.put(userId, JSON.stringify(member));

    // 歡迎訊息
    await pushMessage(userId, [
      {
        type: 'text',
        text: `${member.displayName} 您好，歡迎加入「日月潭低碳旅遊手帖」。\n\n踏訪 16 個嚴選據點，集滿 10 點即可兌換專屬碳麵包。點擊下方選單開始旅程。`
      }
    ], env.LINE_CHANNEL_ACCESS_TOKEN);
    return;
  }

  // 解除好友
  if (event.type === 'unfollow') {
    const raw = await env.MEMBERS.get(userId);
    if (raw) {
      const m = JSON.parse(raw);
      m.status = 'unfollowed';
      m.unfollowedAt = new Date().toISOString();
      await env.MEMBERS.put(userId, JSON.stringify(m));
    }
    return;
  }

  // 一般訊息：更新 lastSeenAt、回覆固定訊息
  if (event.type === 'message') {
    const raw = await env.MEMBERS.get(userId);
    if (raw) {
      const m = JSON.parse(raw);
      m.lastSeenAt = new Date().toISOString();
      await env.MEMBERS.put(userId, JSON.stringify(m));
    }

    const text = event.message?.type === 'text' ? event.message.text.trim() : '';

    // 簡易關鍵字回應
    if (text === '真人回覆' || text.includes('客服')) {
      await lineApi('/v2/bot/message/reply', 'POST', {
        replyToken: event.replyToken,
        messages: [{
          type: 'text',
          text: '已通知客服人員，將於營業時間內與您聯繫。\n如有緊急事項請撥：049-2855-679'
        }]
      }, env.LINE_CHANNEL_ACCESS_TOKEN);
    } else if (text && text.length < 30) {
      // 任何文字回傳選單提示
      await lineApi('/v2/bot/message/reply', 'POST', {
        replyToken: event.replyToken,
        messages: [{
          type: 'text',
          text: '請點擊下方選單開始您的低碳旅程 🌿\n\n・綠色地圖：查看合作據點\n・集碳行動：前往打卡\n・兌換麵包：查看獎勵'
        }]
      }, env.LINE_CHANNEL_ACCESS_TOKEN);
    }
  }
}

// ============================================
// 管理 API（需要 X-Admin-Token）
// ============================================
function requireAdmin(request, env) {
  const token = request.headers.get('x-admin-token');
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}

async function getAllMembers(env) {
  const list = await env.MEMBERS.list();
  const members = [];
  for (const key of list.keys) {
    const raw = await env.MEMBERS.get(key.name);
    if (raw) members.push(JSON.parse(raw));
  }
  return members;
}

async function handleMembers(request, env) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;
  const members = await getAllMembers(env);
  return jsonResponse({ count: members.length, members });
}

async function handleStats(request, env) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;
  const members = await getAllMembers(env);
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return jsonResponse({
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    unfollowed: members.filter(m => m.status === 'unfollowed').length,
    recentActive: members.filter(m => new Date(m.lastSeenAt).getTime() > thirtyDaysAgo).length,
    totalCheckIns: members.reduce((s, m) => s + (m.checkIns || 0), 0),
    totalPoints: members.reduce((s, m) => s + (m.points || 0), 0)
  });
}

async function handlePush(request, env) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;
  const { userId, text } = await request.json();
  if (!userId || !text) return jsonResponse({ error: 'userId and text required' }, 400);
  const result = await pushMessage(userId, [{ type: 'text', text }], env.LINE_CHANNEL_ACCESS_TOKEN);
  return jsonResponse(result.ok ? { ok: true } : { ok: false, error: result.data }, result.status);
}

async function handleBroadcast(request, env) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;
  const { text } = await request.json();
  if (!text) return jsonResponse({ error: 'text required' }, 400);
  const result = await broadcastMessage([{ type: 'text', text }], env.LINE_CHANNEL_ACCESS_TOKEN);
  return jsonResponse(result.ok ? { ok: true } : { ok: false, error: result.data }, result.status);
}

// ============================================
// 回應輔助
// ============================================
function jsonResponse(data, status = 200, origin = '*') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }
  });
}

function corsResponse(origin) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// ============================================
// 主入口
// ============================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') return corsResponse(origin);

    // LINE Webhook（LINE 伺服器呼叫，不需 CORS）
    if (path === '/api/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }

    // 健康檢查
    if (path === '/api/health') {
      return jsonResponse({ ok: true, time: new Date().toISOString() }, 200, origin);
    }

    // 管理 API（需 X-Admin-Token）
    if (path === '/api/members' && request.method === 'GET') {
      const res = await handleMembers(request, env);
      res.headers.set('Access-Control-Allow-Origin', origin);
      return res;
    }
    if (path === '/api/stats' && request.method === 'GET') {
      const res = await handleStats(request, env);
      res.headers.set('Access-Control-Allow-Origin', origin);
      return res;
    }
    if (path === '/api/push' && request.method === 'POST') {
      const res = await handlePush(request, env);
      res.headers.set('Access-Control-Allow-Origin', origin);
      return res;
    }
    if (path === '/api/broadcast' && request.method === 'POST') {
      const res = await handleBroadcast(request, env);
      res.headers.set('Access-Control-Allow-Origin', origin);
      return res;
    }

    return jsonResponse({ error: 'Not Found', path }, 404, origin);
  }
};
