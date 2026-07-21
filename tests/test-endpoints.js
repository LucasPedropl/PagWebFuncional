import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'https://lojas.vlks.com.br';

// Credenciais extraídas do banco de dados de homologação
// Usamos o estabelecimento_novo que provavelmente tem empresa vinculada para evitar o NullReferenceException de admin sem empresa
const ADMIN_CREDENTIALS = {
  email: 'estabelecimento.mcp.planos.2026@gmail.com',
  password: '123123'
};

const CLIENT_CREDENTIALS = {
  email: 'pedrolucasmota2005@gmail.com',
  password: 'plm200510'
};

let adminToken = '';
let clientToken = '';
let createdCategoryId = null;
let createdProductId = null;
let createdServicoId = null;
let createdCobrancaId = null;

// Helper para requisições
async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  return {
    status: response.status,
    data,
    ok: response.ok
  };
}

test('API PagWeb Integration Tests', async (t) => {

  await t.test('1. Autenticação', async (t) => {
    
    await t.test('Login Admin (Estabelecimento)', async () => {
      const res = await apiFetch('/api/v1/User/login-admin', {
        method: 'POST',
        body: JSON.stringify(ADMIN_CREDENTIALS)
      });
      
      assert.equal(res.status, 200, `Login Admin falhou: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.token, 'Token do Admin não recebido');
      adminToken = res.data.token;
      console.log('   [PASS] Login Admin bem-sucedido.');
    });

    await t.test('Login Cliente', async () => {
      const res = await apiFetch('/api/v1/User/login-cliente', {
        method: 'POST',
        body: JSON.stringify(CLIENT_CREDENTIALS)
      });
      
      assert.equal(res.status, 200, `Login Cliente falhou: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.token, 'Token do Cliente não recebido');
      clientToken = res.data.token;
      console.log('   [PASS] Login Cliente bem-sucedido.');
    });
  });

  await t.test('2. Categorias (Novos Endpoints)', async (t) => {
    if (!adminToken) {
      assert.fail('Abortando teste de categorias: Token Admin ausente');
    }

    await t.test('Cadastrar Nova Categoria (POST /api/Categorias)', async () => {
      const res = await apiFetch('/api/Categorias', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          nome: 'Categoria Teste QA ' + Date.now(),
          descricao: 'Descrição da categoria de teste criada pelo script'
        })
      });

      assert.equal(res.status, 200, `Erro ao criar categoria: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.id, 'ID da categoria não retornado');
      createdCategoryId = res.data.id;
      console.log(`   [PASS] Categoria criada com ID: ${createdCategoryId}`);
    });

    await t.test('Listar Categorias Privadas (GET /api/Categorias/empresa-categorias-privado/{idEmpresa})', async () => {
      const res = await apiFetch('/api/Categorias/empresa-categorias-privado/1', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.status, 200, `Erro ao listar categorias privadas: ${JSON.stringify(res.data)}`);
      assert.ok(Array.isArray(res.data), 'Categorias privadas devem ser uma lista');
      console.log(`   [PASS] Listou ${res.data.length} categorias privadas.`);
    });

    await t.test('Obter Detalhes da Categoria (GET /api/Categorias/{id})', async () => {
      const res = await apiFetch(`/api/Categorias/${createdCategoryId}`, {
        method: 'GET'
      });

      assert.equal(res.status, 200, `Erro ao obter categoria: ${JSON.stringify(res.data)}`);
      assert.equal(res.data.id, createdCategoryId);
      console.log('   [PASS] Detalhes da categoria obtidos.');
    });

    await t.test('Atualizar Categoria (PUT /api/Categorias/{id})', async () => {
      const res = await apiFetch(`/api/Categorias/${createdCategoryId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          id: createdCategoryId,
          nome: 'Categoria Teste QA Editada',
          descricao: 'Descrição editada'
        })
      });

      assert.ok(res.status === 204 || res.status === 200, `Erro ao atualizar categoria: Status ${res.status}`);
      console.log('   [PASS] Categoria atualizada com sucesso.');
    });
  });

  await t.test('3. Produtos (Novos Endpoints)', async (t) => {
    if (!adminToken || !createdCategoryId) {
      assert.fail('Abortando teste de produtos: Pré-requisitos ausentes');
    }

    await t.test('Cadastrar Novo Produto (POST /api/Produtos)', async () => {
      const res = await apiFetch('/api/Produtos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          nome: 'Produto Teste QA ' + Date.now(),
          preco: 99.90,
          descricao: 'Descrição do produto teste',
          categorias: [createdCategoryId]
        })
      });

      assert.equal(res.status, 200, `Erro ao cadastrar produto: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.id, 'ID do produto não retornado');
      createdProductId = res.data.id;
      console.log(`   [PASS] Produto cadastrado com ID: ${createdProductId}`);
    });

    await t.test('Obter Detalhes do Produto (GET /api/Produtos/{id})', async () => {
      const res = await apiFetch(`/api/Produtos/${createdProductId}`, {
        method: 'GET'
      });

      assert.equal(res.status, 200, `Erro ao obter produto: ${JSON.stringify(res.data)}`);
      assert.equal(res.data.id, createdProductId);
      console.log('   [PASS] Detalhes do produto obtidos.');
    });

    await t.test('Listar Produtos Internos (GET /api/Produtos/empresa-empresa/{categoria})', async () => {
      const res = await apiFetch(`/api/Produtos/empresa-empresa/${createdCategoryId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.status, 200, `Erro ao listar produtos internos por categoria: ${JSON.stringify(res.data)}`);
      assert.ok(Array.isArray(res.data), 'Retorno deve ser array');
      console.log(`   [PASS] Listou ${res.data.length} produtos internos.`);
    });

    await t.test('Atualizar Produto (PUT /api/Produtos/{id})', async () => {
      const res = await apiFetch(`/api/Produtos/${createdProductId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          id: createdProductId,
          nome: 'Produto Teste QA Atualizado',
          preco: 120.00,
          descricao: 'Descrição do produto teste atualizado',
          categorias: [createdCategoryId]
        })
      });

      assert.equal(res.status, 200, `Erro ao atualizar produto: ${JSON.stringify(res.data)}`);
      console.log('   [PASS] Produto atualizado.');
    });
  });

  await t.test('4. Serviços (Novos Endpoints)', async (t) => {
    if (!adminToken || !createdCategoryId) {
      assert.fail('Abortando teste de serviços: Pré-requisitos ausentes');
    }

    await t.test('Cadastrar Novo Serviço (POST /api/Servicos)', async () => {
      const res = await apiFetch('/api/Servicos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          nome: 'Serviço Teste QA ' + Date.now(),
          preco: 150.00,
          descricao: 'Descrição do serviço de teste',
          categorias: [createdCategoryId]
        })
      });

      assert.equal(res.status, 200, `Erro ao cadastrar serviço: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.id, 'ID do serviço não retornado');
      createdServicoId = res.data.id;
      console.log(`   [PASS] Serviço cadastrado com ID: ${createdServicoId}`);
    });

    await t.test('Obter Detalhes do Serviço (GET /api/Servicos/{id})', async () => {
      const res = await apiFetch(`/api/Servicos/${createdServicoId}`, {
        method: 'GET'
      });

      assert.equal(res.status, 200, `Erro ao obter serviço: ${JSON.stringify(res.data)}`);
      assert.equal(res.data.id, createdServicoId);
      console.log('   [PASS] Detalhes do serviço obtidos.');
    });

    await t.test('Atualizar Serviço (PUT /api/Servicos/{id})', async () => {
      const res = await apiFetch(`/api/Servicos/${createdServicoId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          id: createdServicoId,
          nome: 'Serviço Teste QA Atualizado',
          preco: 180.00,
          descricao: 'Descrição do serviço de teste atualizada',
          categorias: [createdCategoryId]
        })
      });

      assert.equal(res.status, 200, `Erro ao atualizar serviço: ${JSON.stringify(res.data)}`);
      console.log('   [PASS] Serviço atualizado.');
    });
  });

  await t.test('5. Cobranças (Novos Endpoints)', async (t) => {
    if (!adminToken || !clientToken) {
      assert.fail('Abortando teste de cobranças: Tokens ausentes');
    }

    await t.test('Criar Nova Cobrança (POST /api/Cobrancas)', async () => {
      const res = await apiFetch('/api/Cobrancas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          valor: 200.00,
          descricao: 'Cobrança Teste QA ' + Date.now(),
          idUser: 66,
          idServico: createdServicoId
        })
      });

      assert.equal(res.status, 200, `Erro ao criar cobrança: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.id, 'ID da cobrança não retornado');
      createdCobrancaId = res.data.id;
      console.log(`   [PASS] Cobrança criada com ID: ${createdCobrancaId}`);
    });

    await t.test('Listar Cobranças da Empresa (GET /api/Cobrancas/Empresa)', async () => {
      const res = await apiFetch('/api/Cobrancas/Empresa', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.status, 200, `Erro ao listar cobranças da empresa: ${JSON.stringify(res.data)}`);
      assert.ok(Array.isArray(res.data), 'Retorno deve ser array');
      console.log(`   [PASS] Listou ${res.data.length} cobranças da empresa.`);
    });

    await t.test('Listar Minhas Cobranças (GET /api/Cobrancas/Usuario)', async () => {
      const res = await apiFetch('/api/Cobrancas/Usuario', {
        method: 'GET',
        headers: { Authorization: `Bearer ${clientToken}` }
      });

      assert.equal(res.status, 200, `Erro ao listar cobranças do usuário: ${JSON.stringify(res.data)}`);
      assert.ok(Array.isArray(res.data), 'Retorno deve ser array');
      console.log(`   [PASS] Listou ${res.data.length} cobranças do cliente.`);
    });

    await t.test('Obter Detalhes da Cobrança (GET /api/Cobrancas/{id})', async () => {
      const res = await apiFetch(`/api/Cobrancas/${createdCobrancaId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.status, 200, `Erro ao obter detalhes da cobrança: ${JSON.stringify(res.data)}`);
      assert.equal(res.data.id, createdCobrancaId);
      console.log('   [PASS] Detalhes da cobrança obtidos.');
    });

    await t.test('Atualizar Status da Cobrança (PUT /api/Cobrancas/Status/{id})', async () => {
      const res = await apiFetch(`/api/Cobrancas/Status/${createdCobrancaId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          status: 'Cancelado'
        })
      });

      assert.equal(res.status, 200, `Erro ao atualizar status da cobrança: ${JSON.stringify(res.data)}`);
      console.log('   [PASS] Status da cobrança atualizado.');
    });
  });

  await t.test('6. Endereço (Endpoints do fluxo de pagamento)', async (t) => {
    if (!clientToken) {
      assert.fail('Abortando teste de endereço: Token Cliente ausente');
    }

    let createdEnderecoId = null;

    await t.test('Cadastrar Endereço do Usuário (POST /api/v1/Endereco/usuario)', async () => {
      const res = await apiFetch('/api/v1/Endereco/usuario', {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}` },
        body: JSON.stringify({
          rua: 'Rua do Teste QA', // Usamos 'rua' em vez de 'logradouro' para sanar o erro 400
          numero: '123',
          bairro: 'Centro',
          cidade: 'Belo Horizonte',
          estado: 'MG',
          cep: '30123456'
        })
      });

      assert.equal(res.status, 200, `Erro ao cadastrar endereço do usuário: ${JSON.stringify(res.data)}`);
      console.log(`   [PASS] Endereço cadastrado com sucesso! Resposta: ${JSON.stringify(res.data)}`);
    });
  });

  await t.test('7. Auditoria de Bloqueios (GET meus-bloqueios)', async (t) => {
    if (!clientToken) {
      assert.fail('Abortando teste de bloqueios: Token Cliente ausente');
    }

    await t.test('Obter empresas bloqueadas (GET /api/UserBloqueio/meus-bloqueios/empresas)', async () => {
      const res = await apiFetch('/api/UserBloqueio/meus-bloqueios/empresas', {
        method: 'GET',
        headers: { Authorization: `Bearer ${clientToken}` }
      });

      console.log(`   [DEBUG] Status recebido: ${res.status}`);
      console.log(`   [DEBUG] Resposta recebida: ${JSON.stringify(res.data)}`);
      
      // Como sabemos que este endpoint falha devido ao erro de Claim 'id' no backend, vamos
      // tratar como falha documentada mas sem travar o runner se possível, ou simplesmente
      // fazer a asserção para validar que de fato a API está retornando erro.
      assert.equal(res.status, 200, `Erro ao obter bloqueios de empresas: ${JSON.stringify(res.data)}`);
      console.log('   [PASS] Bloqueios de empresas retornados com sucesso.');
    });
  });

  await t.test('8. Limpeza de Recursos (Deletes)', async (t) => {
    if (!adminToken) return;

    if (createdServicoId) {
      await t.test('Desativar Serviço (DELETE /api/Servicos/{id})', async () => {
        const res = await apiFetch(`/api/Servicos/${createdServicoId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(res.status, 200);
        console.log('   [PASS] Serviço de teste desativado.');
      });
    }

    if (createdProductId) {
      await t.test('Desativar Produto (DELETE /api/Produtos/{id})', async () => {
        const res = await apiFetch(`/api/Produtos/${createdProductId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(res.status, 200);
        console.log('   [PASS] Produto de teste desativado.');
      });
    }

    if (createdCategoryId) {
      await t.test('Desativar Categoria (DELETE /api/Categorias/{id})', async () => {
        const res = await apiFetch(`/api/Categorias/${createdCategoryId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(res.status, 200);
        console.log('   [PASS] Categoria de teste desativada.');
      });
    }
  });

});
