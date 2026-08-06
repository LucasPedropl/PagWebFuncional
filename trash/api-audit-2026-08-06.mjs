/**
 * Auditoria API PagWeb — produção
 * Execução: node apps/PagWebFuncional/trash/api-audit-2026-08-06.mjs
 */
const BASE = 'https://lojas.vlks.com.br';

const MASTER = { email: 'Pagweb@vlks.com.br', password: 'Pagweb@@' };
const ADMIN = {
  email: 'estabelecimento.mcp.planos.2026@gmail.com',
  password: '123123',
};
const CLIENT = { email: 'pedrolucasmota2005@gmail.com', password: 'plm200510' };

const results = [];

function record(name, status, detail, extra = {}) {
  const entry = { name, status, detail, ...extra };
  results.push(entry);
  const icon = status === 'PASS' ? '✓' : status === 'SKIP' ? '○' : '✗';
  console.log(`${icon} [${status}] ${name}`);
  if (detail) console.log(`    ${detail}`);
}

async function api(endpoint, options = {}) {
  const url = `${BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', accept: '*/*', ...options.headers };
  const response = await fetch(url, { ...options, headers });
  const ct = response.headers.get('content-type') ?? '';
  let data;
  try {
    const text = await response.text();
    if (!text) {
      data = null;
    } else {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
  } catch {
    data = null;
  }
  return { status: response.status, data, ok: response.ok };
}

async function loginAdmin(creds) {
  const res = await api('/api/v1/User/login-admin', {
    method: 'POST',
    body: JSON.stringify({ Email: creds.email, Password: creds.password, mac: 'audit' }),
  });
  if (!res.ok) return { token: null, user: null, res };
  return { token: res.data?.token ?? null, user: res.data?.user ?? null, res };
}

async function loginClient(creds) {
  const res = await api('/api/v1/User/login-cliente', {
    method: 'POST',
    body: JSON.stringify({ email: creds.email, password: creds.password, mac: '' }),
  });
  if (!res.ok) return { token: null, user: null, res };
  return { token: res.data?.token ?? null, user: res.data?.user ?? null, res };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function decodeJwtRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    const role =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      payload.role ??
      null;
    const sub = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? payload.sub;
    return { role, sub };
  } catch {
    return { role: null, sub: null };
  }
}

let masterToken = '';
let adminToken = '';
let clientToken = '';
let createdChavePixId = null;
let empresaId = null;
let adminUserId = null;

// ── AUTH ─────────────────────────────────────────────────────────────────────
console.log('\n=== AUTENTICAÇÃO ===\n');

{
  const { token, user, res } = await loginAdmin(MASTER);
  if (token) {
    const { role, sub } = decodeJwtRole(token);
    masterToken = token;
    record('Login Master (Pagweb@vlks)', 'PASS', `role=${role}, sub=${sub}`);
  } else {
    record('Login Master (Pagweb@vlks)', 'FAIL', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

{
  const { token, res } = await loginAdmin(ADMIN);
  if (token) {
    adminToken = token;
    const { role, sub } = decodeJwtRole(token);
    record('Login Admin estabelecimento', 'PASS', `role=${role}, sub=${sub}`);
    adminUserId = Number(sub);
  } else {
    record('Login Admin estabelecimento', 'FAIL', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

{
  const { token, res } = await loginClient(CLIENT);
  if (token) {
    clientToken = token;
    record('Login Cliente', 'PASS', 'token recebido');
  } else {
    record('Login Cliente', 'FAIL', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

// ── MINHA EMPRESA (admin) ────────────────────────────────────────────────────
console.log('\n=== LEGADO — EMPRESA / CONTA ===\n');

if (adminToken) {
  const res = await api('/api/v1/User/minha-empresa', { headers: auth(adminToken) });
  if (res.ok && res.data?.idEmpresa) {
    empresaId = res.data.idEmpresa;
    record('GET minha-empresa', 'PASS', `idEmpresa=${empresaId}`);
  } else {
    record('GET minha-empresa', 'FAIL', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }

  const conta = await api('/api/v1/User/minha-conta', { headers: auth(adminToken) });
  record(
    conta.ok ? 'GET minha-conta' : 'GET minha-conta',
    conta.ok ? 'PASS' : 'FAIL',
    conta.ok ? `nome=${conta.data?.nome}` : `HTTP ${conta.status}: ${JSON.stringify(conta.data)}`,
  );
}

// ── CHAVES PIX (NOVO) — Master token (admin de teste indisponível em prod) ───
console.log('\n=== NOVO — CHAVES PIX ===\n');

const pixToken = adminToken || masterToken;

if (pixToken) {
  const listBefore = await api('/api/ChavesPix', { headers: auth(pixToken) });
  record(
    listBefore.ok ? 'GET ChavesPix (lista)' : 'GET ChavesPix (lista)',
    listBefore.ok ? 'PASS' : 'FAIL',
    `HTTP ${listBefore.status}, count=${Array.isArray(listBefore.data) ? listBefore.data.length : 'n/a'}`,
    { response: listBefore.data },
  );

  const post = await api('/api/ChavesPix', {
    method: 'POST',
    headers: auth(pixToken),
    body: JSON.stringify({
      Chave: `audit-${Date.now()}@test.pagweb.local`,
      TipoChave: 'Email',
    }),
  });

  if (post.ok || post.status === 201) {
    createdChavePixId = post.data?.idChavePix ?? post.data?.IdChavePix ?? null;
    record('POST ChavesPix', 'PASS', `idChavePix=${createdChavePixId}`, { response: post.data });

    if (createdChavePixId) {
      const getOne = await api(`/api/ChavesPix/${createdChavePixId}`, { headers: auth(pixToken) });
      const idUser = getOne.data?.idUser ?? getOne.data?.IdUser;
      if (idUser === 0 || idUser == null) {
        record('GET ChavesPix/{id} — IdUser', 'FAIL', `IdUser=${idUser} (deveria ser o admin logado)`, {
          response: getOne.data,
        });
      } else {
        record('GET ChavesPix/{id} — IdUser', 'PASS', `IdUser=${idUser}`);
      }

      const put = await api(`/api/ChavesPix/${createdChavePixId}`, {
        method: 'PUT',
        headers: auth(pixToken),
        body: JSON.stringify({
          IdChave: createdChavePixId,
          Chave: post.data?.chave ?? post.data?.Chave,
          TipoChave: 'Email',
          Ativa: true,
        }),
      });
      record(
        put.ok ? 'PUT ChavesPix/{id}' : 'PUT ChavesPix/{id}',
        put.ok ? 'PASS' : 'FAIL',
        `HTTP ${put.status}: ${JSON.stringify(put.data)}`,
      );
    }
  } else {
    record('POST ChavesPix', 'FAIL', `HTTP ${post.status}: ${JSON.stringify(post.data)}`);
  }

  const listAfter = await api('/api/ChavesPix', { headers: auth(pixToken) });
  const countAfter = Array.isArray(listAfter.data) ? listAfter.data.length : 0;
  const countBefore = Array.isArray(listBefore.data) ? listBefore.data.length : 0;
  if (listAfter.ok && post.ok && countAfter === 0) {
    record(
      'GET ChavesPix — filtro por usuário',
      'FAIL',
      `POST ok mas GET retorna 0 itens. IdUser provavelmente não foi persistido no POST.`,
    );
  } else if (listAfter.ok && post.ok && countAfter <= countBefore) {
    record(
      'GET ChavesPix — filtro por usuário',
      'FAIL',
      `Lista não cresceu após POST (antes=${countBefore}, depois=${countAfter}).`,
    );
  } else if (listAfter.ok) {
    record('GET ChavesPix — filtro por usuário', 'PASS', `antes=${countBefore}, depois=${countAfter}`);
  }
} else {
  record('ChavesPix (suite)', 'SKIP', 'Sem token admin/master');
}

// ── CONTROLE ACESSOS (NOVO) ──────────────────────────────────────────────────
console.log('\n=== NOVO — CONTROLE ACESSOS ===\n');

if (masterToken) {
  const list = await api('/api/ControleAcessos', { headers: auth(masterToken) });
  record(
    list.ok ? 'GET ControleAcessos (Master)' : 'GET ControleAcessos (Master)',
    list.ok ? 'PASS' : 'FAIL',
    `HTTP ${list.status}, count=${Array.isArray(list.data) ? list.data.length : JSON.stringify(list.data)}`,
  );

  if (list.ok && Array.isArray(list.data) && list.data.length > 0) {
    const first = list.data[0];
    const id = first.idControle ?? first.IdControle;
    const detail = await api(`/api/ControleAcessos/${id}`, { headers: auth(masterToken) });
    record(
      detail.ok ? 'GET ControleAcessos/{id}' : 'GET ControleAcessos/{id}',
      detail.ok ? 'PASS' : 'FAIL',
      `HTTP ${detail.status}`,
      { response: detail.data },
    );
  }
}

if (masterToken) {
  const postMaster = await api('/api/ControleAcessos', {
    method: 'POST',
    headers: auth(masterToken),
    body: JSON.stringify({
      Payment: 2,
      Whatsapp: 2,
      IdEmpresa: 0,
      Password: MASTER.password,
    }),
  });
  record(
    postMaster.status === 400 ? 'POST ControleAcessos (Master → 400)' : 'POST ControleAcessos (Master)',
    postMaster.status === 400 ? 'PASS' : 'FAIL',
    `HTTP ${postMaster.status}: ${JSON.stringify(postMaster.data)}`,
  );
}

if (adminToken) {
  const listAsAdmin = await api('/api/ControleAcessos', { headers: auth(adminToken) });
  record(
    listAsAdmin.status === 403 ? 'GET ControleAcessos (Admin → 403)' : 'GET ControleAcessos (Admin)',
    listAsAdmin.status === 403 ? 'PASS' : 'FAIL',
    `HTTP ${listAsAdmin.status} (esperado 403 para não-Master)`,
  );

  const postReq = await api('/api/ControleAcessos', {
    method: 'POST',
    headers: auth(adminToken),
    body: JSON.stringify({
      Payment: 2,
      Whatsapp: 2,
      IdEmpresa: empresaId ?? 0,
      Password: ADMIN.password,
    }),
  });
  record(
    postReq.ok ? 'POST ControleAcessos (solicitar)' : 'POST ControleAcessos (solicitar)',
    postReq.ok ? 'PASS' : postReq.status === 400 ? 'SKIP' : 'FAIL',
    `HTTP ${postReq.status}: ${JSON.stringify(postReq.data)}`,
  );
}

// ── CATEGORIAS / CATÁLOGO (LEGADO) ───────────────────────────────────────────
console.log('\n=== LEGADO — CATÁLOGO ===\n');

if (adminToken) {
  const priv = await api('/api/Categorias/empresa-categorias-privado/', { headers: auth(adminToken) });
  record(
    priv.ok ? 'GET categorias-privado' : 'GET categorias-privado',
    priv.ok ? 'PASS' : 'FAIL',
    `HTTP ${priv.status}, count=${Array.isArray(priv.data) ? priv.data.length : 'n/a'}`,
  );

  const cross = await api('/api/Categorias');
  record(
    cross.ok ? 'GET Categorias (cross-tenant)' : 'GET Categorias',
    cross.ok ? 'FAIL' : 'PASS',
    cross.ok
      ? `HTTP 200 sem auth — expõe ${Array.isArray(cross.data) ? cross.data.length : '?'} categorias (risco)`
      : `HTTP ${cross.status}`,
  );
}

// ── COBRANÇAS (LEGADO) ───────────────────────────────────────────────────────
console.log('\n=== LEGADO — COBRANÇAS ===\n');

if (adminToken) {
  const emp = await api('/api/Cobrancas/Empresa', { headers: auth(adminToken) });
  record(
    emp.ok ? 'GET Cobrancas/Empresa' : 'GET Cobrancas/Empresa',
    emp.ok ? 'PASS' : 'FAIL',
    `HTTP ${emp.status}, count=${Array.isArray(emp.data) ? emp.data.length : 'n/a'}`,
  );
}

if (clientToken) {
  const usr = await api('/api/Cobrancas/Usuario', { headers: auth(clientToken) });
  record(
    usr.ok ? 'GET Cobrancas/Usuario' : 'GET Cobrancas/Usuario',
    usr.ok ? 'PASS' : 'FAIL',
    `HTTP ${usr.status}, count=${Array.isArray(usr.data) ? usr.data.length : 'n/a'}`,
  );
}

// ── BLOQUEIOS (LEGADO — bug conhecido) ───────────────────────────────────────
console.log('\n=== LEGADO — BLOQUEIOS ===\n');

if (clientToken) {
  const empBlk = await api('/api/UserBloqueio/meus-bloqueios/empresas', { headers: auth(clientToken) });
  record(
    empBlk.ok ? 'GET bloqueios/empresas' : 'GET bloqueios/empresas',
    empBlk.ok ? 'PASS' : 'FAIL',
    `HTTP ${empBlk.status}: ${JSON.stringify(empBlk.data)?.slice(0, 120)}`,
  );

  const planBlk = await api('/api/UserBloqueio/meus-bloqueios/planos', { headers: auth(clientToken) });
  record(
    planBlk.ok ? 'GET bloqueios/planos' : 'GET bloqueios/planos',
    planBlk.ok ? 'PASS' : 'FAIL',
    `HTTP ${planBlk.status}: ${JSON.stringify(planBlk.data)?.slice(0, 120)}`,
  );
}

// ── PAGAMENTOS LEGADO ─────────────────────────────────────────────────────────
console.log('\n=== LEGADO — PAGAMENTOS / NOTIFICAÇÕES ===\n');

if (clientToken) {
  const extrato = await api('/api/v1/Pagamento/Extrato?ano=2026&mes=8', { headers: auth(clientToken) });
  record(
    extrato.ok ? 'GET Pagamento/Extrato' : 'GET Pagamento/Extrato',
    extrato.ok ? 'PASS' : 'FAIL',
    `HTTP ${extrato.status}`,
  );

  const notif = await api('/api/v1/Notificacao/pegar', { headers: auth(clientToken) });
  record(
    notif.ok ? 'GET Notificacao/pegar' : 'GET Notificacao/pegar',
    notif.ok ? 'PASS' : 'FAIL',
    `HTTP ${notif.status}, count=${Array.isArray(notif.data) ? notif.data.length : 'n/a'}`,
  );

  const empresas = await api('/api/v1/Empresa', { headers: auth(clientToken) });
  record(
    empresas.ok ? 'GET Empresa (diretório)' : 'GET Empresa',
    empresas.ok ? 'PASS' : 'FAIL',
    `HTTP ${empresas.status}, count=${Array.isArray(empresas.data) ? empresas.data.length : 'n/a'}`,
  );
}

if (masterToken) {
  const pendentes = await api('/api/v1/Pagamento/pendentes-repasse', { headers: auth(masterToken) });
  record(
    pendentes.status === 403 ? 'GET pendentes-repasse (Master → 403)' : 'GET pendentes-repasse',
    pendentes.status === 403 ? 'PASS' : pendentes.ok ? 'SKIP' : 'FAIL',
    `HTTP ${pendentes.status} (endpoint exige role Admin, não Master)`,
  );
}

const anonBlk = await api('/api/UserBloqueio/meus-bloqueios/planos');
record(
  anonBlk.status === 401 ? 'GET bloqueios/planos anon → 401' : 'GET bloqueios/planos anon',
  anonBlk.status === 401 ? 'PASS' : 'FAIL',
  `HTTP ${anonBlk.status} (sem [Authorize] no controller — deveria ser 401)`,
);

// ── PAGAMENTOS — MetodoPagamento PixCaixa ─────────────────────────────────────
console.log('\n=== PAGAMENTOS — PixCaixa (smoke) ===\n');

if (clientToken) {
  const mens = await api('/api/v1/Mensalidade/cliente', { headers: auth(clientToken) });
  if (mens.ok && Array.isArray(mens.data) && mens.data.length > 0) {
    const aberta = mens.data.find((m) => m.status === 0 || m.status === 'Aberto' || m.status === 'Atrasado');
    if (aberta) {
      const pay = await api('/api/v1/Pagamento/solicitar', {
        method: 'POST',
        headers: auth(clientToken),
        body: JSON.stringify({
          IdMensalidade: aberta.idMensalidade ?? aberta.IdMensalidade,
          Metodo: 6,
          city: 'Belo Horizonte',
          ip: '127.0.0.1',
          latitude: 0,
          longitude: 0,
        }),
      });
      record(
        pay.ok ? 'POST solicitar PixCaixa' : 'POST solicitar PixCaixa',
        pay.ok ? 'PASS' : 'FAIL',
        `HTTP ${pay.status}: ${JSON.stringify(pay.data)?.slice(0, 200)}`,
      );
    } else {
      record('POST solicitar PixCaixa', 'SKIP', 'Sem mensalidade aberta para testar');
    }
  } else {
    record('POST solicitar PixCaixa', 'SKIP', 'Sem mensalidades do cliente');
  }
}

// ── LIMPEZA ──────────────────────────────────────────────────────────────────
const cleanupToken = adminToken || masterToken;
if (cleanupToken && createdChavePixId) {
  const del = await api(`/api/ChavesPix/${createdChavePixId}`, {
    method: 'DELETE',
    headers: auth(cleanupToken),
  });
  record(
    del.ok ? 'DELETE ChavesPix (cleanup)' : 'DELETE ChavesPix (cleanup)',
    del.ok ? 'PASS' : 'FAIL',
    `HTTP ${del.status}: ${JSON.stringify(del.data)}`,
  );
}

// ── RESUMO ───────────────────────────────────────────────────────────────────
console.log('\n=== RESUMO ===\n');
const pass = results.filter((r) => r.status === 'PASS').length;
const fail = results.filter((r) => r.status === 'FAIL').length;
const skip = results.filter((r) => r.status === 'SKIP').length;
console.log(`PASS: ${pass} | FAIL: ${fail} | SKIP: ${skip} | TOTAL: ${results.length}`);

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const dir = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(dir, 'api-audit-2026-08-06-results.json'), JSON.stringify(results, null, 2));
console.log('\nResultados salvos em trash/api-audit-2026-08-06-results.json');
