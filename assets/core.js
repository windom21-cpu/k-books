const CFG = window.APP_CONFIG;
console.log(`[zousyo] core.js loaded (${CFG.version})`);

// タイトルバーにバージョン表示(キャッシュ有無を一目で判断するため)
window.addEventListener('DOMContentLoaded', () => {
  const tb = document.querySelector('.title-bar-text');
  if (tb && CFG.version && !tb.textContent.includes(CFG.version)) {
    tb.textContent = `${tb.textContent} ${CFG.version}`;
  }
});

const PAT_KEY = 'zousyo_pat';
const NICK_KEY = 'zousyo_nick';

// QR招待URL(#token=...)で来たときにPATを取り込み、URLからは即除去
(function bootstrapTokenFromHash() {
  const h = location.hash;
  const m = h.match(/[#&]token=([^&]+)/);
  if (!m) return;
  const token = decodeURIComponent(m[1]);
  localStorage.setItem(PAT_KEY, token);
  const stripped = h.replace(/([#&])token=[^&]+&?/, '$1').replace(/[#&]$/, '');
  history.replaceState(null, '', location.pathname + location.search + stripped);
  // 軽い通知
  window.addEventListener('DOMContentLoaded', () => {
    const t = document.createElement('div');
    t.textContent = 'PATを受け取りました';
    t.style.cssText = 'position:fixed;top:8px;right:8px;background:#000080;color:#fff;padding:6px 10px;font:12px "MS UI Gothic",sans-serif;z-index:9999;';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  });
})();

export function getPAT() {
  return localStorage.getItem(PAT_KEY) || '';
}
export function setPAT(t) {
  if (t) localStorage.setItem(PAT_KEY, t);
  else localStorage.removeItem(PAT_KEY);
}
export function getNick() {
  return localStorage.getItem(NICK_KEY) || '';
}
export function setNick(n) {
  if (n) localStorage.setItem(NICK_KEY, n);
  else localStorage.removeItem(NICK_KEY);
}

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// NFKC + 小文字化 + 記号類の単純化(検索キー作成用)
export function normalize(s) {
  if (!s) return '';
  return s.normalize('NFKC').toLowerCase()
    .replace(/[　\s]+/g, '')
    .replace(/[!-/:-@\[-`{-~、。「」『』・，．]/g, '');
}

// PATがあれば認証付きAPI経由(CDNキャッシュ回避で常に最新)、無ければraw経由
export async function fetchData() {
  const token = getPAT();
  if (token) {
    try {
      const url = `https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.dataFile}?ref=${CFG.branch}`;
      const r = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'If-None-Match': ''
        },
        cache: 'no-store'
      });
      if (r.ok) {
        const j = await r.json();
        const bytes = Uint8Array.from(atob(j.content.replace(/\n/g, '')), c => c.charCodeAt(0));
        const text = new TextDecoder().decode(bytes);
        const data = JSON.parse(text);
        if (!data.items) data.items = [];
        return data;
      }
      if (r.status === 404) return { items: [] };
      console.warn(`API fetch returned ${r.status}, falling back to raw`);
    } catch (e) {
      console.warn('API fetch failed, falling back to raw', e);
    }
  }
  const url = `https://raw.githubusercontent.com/${CFG.owner}/${CFG.repo}/${CFG.branch}/${CFG.dataFile}?_=${Date.now()}`;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) {
      if (r.status === 404) return { items: [] };
      throw new Error(`fetchData ${r.status}`);
    }
    const json = await r.json();
    if (!json.items) json.items = [];
    return json;
  } catch (e) {
    console.error(e);
    return { items: [] };
  }
}

// SHA取得 + 競合時は再試行する書き込み
async function getFileMeta(token) {
  const url = `https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.dataFile}?ref=${CFG.branch}`;
  const r = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`
    }
  });
  if (r.status === 404) return { content: { items: [] }, sha: null };
  if (!r.ok) throw new Error(`getFileMeta ${r.status}`);
  const j = await r.json();
  const text = decodeURIComponent(escape(atob(j.content.replace(/\n/g, ''))));
  return { content: JSON.parse(text), sha: j.sha };
}

function utf8ToBase64(s) {
  return btoa(unescape(encodeURIComponent(s)));
}

async function putFile(token, contentObj, sha, message) {
  const url = `https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${CFG.dataFile}`;
  const body = {
    message,
    content: utf8ToBase64(JSON.stringify(contentObj, null, 2) + '\n'),
    branch: CFG.branch
  };
  if (sha) body.sha = sha;
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return r;
}

// 直前PUT後のSHA+itemsをメモリに保持。GitHub読み取りレプリカの遅延を回避
let _cache = null;

export function invalidateCache() { _cache = null; }

// mutate(items): items配列を直接編集する関数を渡す。競合したら再取得して再適用
export async function commitMutation(mutate, message) {
  const token = getPAT();
  if (!token) throw new Error('PATが未設定です。設定画面でPATを入力してください。');
  let lastInfo = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    let items, sha, source;
    if (_cache && attempt === 0) {
      items = JSON.parse(JSON.stringify(_cache.items));
      sha = _cache.sha;
      source = 'cache';
    } else {
      const meta = await getFileMeta(token);
      items = meta.content.items;
      sha = meta.sha;
      source = 'fresh';
    }
    console.log(`[zousyo] commitMutation attempt=${attempt} source=${source} sha=${sha?.slice(0,7)} items=${items.length}`);
    mutate(items);
    const r = await putFile(token, { items }, sha, message);
    if (r.ok) {
      const j = await r.json();
      const newSha = j?.content?.sha || null;
      _cache = newSha ? { items, sha: newSha } : null;
      console.log(`[zousyo] commitMutation success newSha=${newSha?.slice(0,7)}`);
      return j;
    }
    const errBody = (await r.text()).slice(0, 250);
    lastInfo = `${r.status} ${errBody}`;
    console.warn(`[zousyo] commitMutation attempt ${attempt} failed: ${lastInfo}`);
    if (r.status === 409 || r.status === 412 || r.status === 422) {
      _cache = null;
      const wait = 500 * Math.pow(1.6, attempt) + Math.random() * 300;
      await new Promise(res => setTimeout(res, wait));
      continue;
    }
    _cache = null;
    throw new Error(`保存失敗 ${lastInfo}`);
  }
  _cache = null;
  throw new Error(`競合再試行が上限に達しました(最後の応答: ${lastInfo})`);
}

// openBD: ISBN -> 書誌
export async function lookupISBN(isbn) {
  const clean = isbn.replace(/[^0-9X]/gi, '');
  try {
    const r = await fetch(`https://api.openbd.jp/v1/get?isbn=${clean}`);
    if (!r.ok) return null;
    const arr = await r.json();
    if (!arr || !arr[0]) return null;
    const b = arr[0];
    const s = b.summary || {};
    const onix = b.onix || {};
    const collation = onix.DescriptiveDetail?.TitleDetail?.TitleElement?.TitleText?.collationkey || '';
    return {
      isbn: s.isbn || clean,
      title: s.title || '',
      series: s.series || '',
      volume: s.volume || '',
      author: s.author || '',
      publisher: s.publisher || '',
      coverUrl: s.cover || '',
      yomi: collation
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

// 重複キー: series + volume + edition
export function dupKey(item) {
  return `${normalize(item.series)}|${item.volume}|${normalize(item.edition || '')}`;
}

export function findDuplicate(items, candidate) {
  const k = dupKey(candidate);
  return items.find(i => dupKey(i) === k);
}

// 巻数の数値抽出(「3」「第3巻」「3巻」「03」全部対応)
export function parseVolume(v) {
  if (v == null) return null;
  const s = String(v).normalize('NFKC');
  const m = s.match(/\d+/);
  return m ? Number(m[0]) : null;
}

export const config = CFG;
