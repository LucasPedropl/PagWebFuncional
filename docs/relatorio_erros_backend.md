# Relatório de Erros - API PagWebV1

> **Última auditoria:** 16/07/2026  
> **API local:** `apps/PagWebFuncional/api/PagWebV1` compilada e testada  
> **API em produção/homologação:** `https://lojas.vlks.com.br`  
> **Frontend:** PagWeb rodando em `http://localhost:3000` ou localmente

---

## Resumo da Auditoria de Erros Pendentes e Novos Encontrados

Todos os erros listados na auditoria anterior foram confirmados como **ainda
pendentes** (não foram corrigidos no código do repositório). Foram identificados
novos problemas de segurança e estabilidade (erros de runtime).

| Categoria / Bug                                              | Status        | Descrição rápida                                                                                                           |
| :----------------------------------------------------------- | :------------ | :------------------------------------------------------------------------------------------------------------------------- |
| **CS8602 — desreferências nulas**                            | **Pendente**  | 384 warnings restantes na compilação do dotnet (testado via `dotnet build`).                                               |
| **Permissões `GET /api/Cobrancas/{id}`**                     | **Pendente**  | Lógica de validação de acesso invertida (vazamento cross-tenant de cobranças).                                             |
| **NullReferenceException no login de admin**                 | **Pendente**  | Operador lógico incorreto (`&&`) na validação de tipo de usuário sem empresa.                                              |
| **Exposição de dados cross-tenant em Categorias**            | **Pendente**  | Endpoints de categoria retornam dados globais sem filtro de empresa e rota privada ignora parâmetro.                       |
| **Acesso inseguro a claims de identificação**                | **Pendente**  | Chamada direta a `.Value` em `User.FindFirst()` sem verificar se a claim é nula em vários controllers.                     |
| **NullReferenceException em `meus-bloqueios` (NOVO)**        | **Novo Erro** | Uso da claim string `"id"` em vez de `ClaimTypes.NameIdentifier` em `UserBloqueioController.cs`.                           |
| **Exposição global sem autorização (NOVO)**                  | **Novo Erro** | `zTemporarioController.cs` expõe listagens de dados confidenciais a usuários anônimos.                                     |
| **Bug Lógico de Validação no Cadastro de Assinatura (NOVO)** | **Novo Erro** | Filtro de verificação usa o administrador em vez do cliente em `AssinaturaController.cs`.                                  |
| **IDOR crítico em configurações de assinatura (NOVO)**       | **Novo Erro** | Endpoints em `NotificacaoController.cs` públicos sem `[Authorize]` permitindo leitura/edição global de dados de terceiros. |
| **Restrição de acesso indevida em planos (NOVO)**            | **Novo Erro** | `GET /api/v1/Plano/{idPlano}` exige role de Admin impedindo leitura de clientes para assinatura.                           |
| **Falha de design em POST de Endereço (NOVO)**               | **Novo Erro** | Rota de cadastro em `EnderecoController.cs` não retorna o ID gerado e não há rota de GET para recuperar o ID.              |

---

## 1. NullReferenceException no `login-admin` para usuários sem empresa

- **Arquivo:** `Controllers/UserAdminController.cs` (linha 46)
- **Código atual:**

    ```csharp
    var tipouser = await _userService.TipoUser(user.IdUser, true);

    if (tipouser == null && tipouser.UserTipo != UserTipo.Admin)
        return Unauthorized(new { message = "Usuario não encontrado" });
    ```

- **Problema:** O operador `&&` está incorreto. Quando `tipouser` é `null` (como
  em novos usuários sem empresa cadastrada), a primeira parte
  (`tipouser == null`) é verdadeira, forçando a avaliação da segunda parte
  (`tipouser.UserTipo`). Como o objeto é nulo, ocorre um travamento por
  `System.NullReferenceException`.
- **Correção sugerida:** Substituir o operador `&&` pelo operador de
  curto-circuito `||` (OU):
    ```csharp
    if (tipouser == null || tipouser.UserTipo != UserTipo.Admin)
        return Unauthorized(new { message = "Usuário não é administrador ou não possui empresa vinculada." });
    ```

---

## 2. Bug crítico de permissão invertida em `GET /api/Cobrancas/{id}`

- **Arquivo:** `Controllers/CobrancasController.cs` (linhas 159–222)
- **Código atual:**
    ```csharp
    if (vinculo != null && vinculo.UserTipo == UserTipo.Admin && vinculo.IdEmpresa != cobranca.IdEmpresa)
    {
        // retorna os dados da cobrança
        return Ok(cobrancaDto);
    }
    else if (cobranca.IdUser == idAdmin)
    {
        return Ok(cobrancaDto);
    }
    return BadRequest("Você não tem permissão para acessar esta cobrança.");
    ```
- **Problema:** A validação de escopo de empresa está **invertida**:
    1.  Se o administrador logado pertencer à **mesma** empresa da cobrança
        (`vinculo.IdEmpresa == cobranca.IdEmpresa`), ele falha no primeiro `if`
        e tem seu acesso negado (a menos que ele mesmo tenha criado a cobrança e
        seja o proprietário dela, caindo no `else if`).
    2.  Se o administrador logado pertencer a uma empresa **diferente** da
        cobrança (`vinculo.IdEmpresa != cobranca.IdEmpresa`), ele entra na
        primeira condição e visualiza a cobrança de terceiros normalmente,
        gerando vazamento de dados cross-tenant.
- **Correção sugerida:**

    ```csharp
    bool temPermissao = false;

    if (vinculo != null && vinculo.UserTipo == UserTipo.Admin)
    {
        if (vinculo.IdEmpresa == cobranca.IdEmpresa)
            temPermissao = true;
    }
    else if (cobranca.IdUser == idAdmin)
    {
        temPermissao = true;
    }

    if (!temPermissao)
        return BadRequest(new { message = "Você não tem permissão para acessar esta cobrança." });
    ```

---

## 3. Ordem incorreta de verificação de nulo em `UserService.cs`

- **Arquivo:** `Services/UserService.cs` (linhas 712–714)
- **Código atual:**

    ```csharp
    var adminconfig = await _context.UserConfigs.FindAsync(adminEmpresa.IdUser);

    if (adminEmpresa != null && adminconfig.Notificacoes == true)
    ```

- **Problema:** A propriedade `adminEmpresa.IdUser` é acessada para buscar a
  configuração antes de validar se o próprio objeto `adminEmpresa` é nulo. Caso
  seja nulo, a linha 712 lançará `NullReferenceException` antes mesmo da
  verificação condicional na linha 714.
- **Correção sugerida:**
    ```csharp
    if (adminEmpresa != null)
    {
        var adminconfig = await _context.UserConfigs.FindAsync(adminEmpresa.IdUser);
        if (adminconfig?.Notificacoes == true)
        {
            // ...
        }
    }
    ```

---

## 4. Exposição de dados cross-tenant em endpoints de Categorias

- **Arquivo:** `Controllers/CategoriasController.cs`
- **Problemas encontrados:**
    1.  `GET /api/Categorias` (linha 43) e `GET /api/Categorias/{id}` (linha 85)
        possuem o atributo `[AllowAnonymous]` e não aplicam nenhum filtro de
        tenant (`idEmpresa`), permitindo que qualquer usuário leia todas as
        categorias de qualquer empresa cadastrada no banco.
    2.  `GET /api/Categorias/empresa-categorias-privado/{idEmpresa}` (linha 57)
        define a rota solicitando `{idEmpresa}`, mas o método correspondente
        `GetCategoriasByEmpresaP()` não recebe o parâmetro no escopo e usa
        apenas a empresa do token JWT (`vinculo.IdEmpresa`). O parâmetro da rota
        é completamente ignorado.
- **Correção sugerida:** Remover o `[AllowAnonymous]` se as categorias não forem
  de acesso público e filtrar pelo ID da empresa correto nos métodos. Na rota
  privada, aceitar o parâmetro e validar se condiz com o token:
    ```csharp
    [HttpGet("empresa-categorias-privado/{idEmpresa}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetCategoriasByEmpresaP(int idEmpresa)
    {
        // ... validar se o idEmpresa é compatível com o vínculo do administrador logado
    }
    ```

---

## 5. NullReferenceException em Claims de Usuário sem Operador Condicional (Generalizado)

- **Arquivos:** `UserAdminController.cs` (linhas 64, 96, 110, 153, 255),
  `AssinaturaController.cs` (linhas 26, 78, 143), `ChatsController.cs` (linhas
  32, 120, 161, 187, 248), `EnderecoController.cs` (linhas 29, 56),
  `MensalidadeController.cs` (linhas 21, 43), `NotificacaoController.cs` (linhas
  100, 111, 122), e `PagamentoController.cs` (linha 429).
- **Problema:** Chamadas constantes no padrão:
    ```csharp
    var idAdmin = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
    // ou
    var idAdmin = User.FindFirst(ClaimTypes.NameIdentifier).Value;
    ```
    Se em algum momento o token do usuário não possuir a claim `NameIdentifier`
    ou estiver malformado, `User.FindFirst` retornará `null`, lançando
    `NullReferenceException` ao acessar `.Value`.
- **Correção sugerida:** Criar uma propriedade auxiliar de controller ou classe
  de extensão para ler o ID do usuário de forma segura:
    ```csharp
    protected int? GetUserIdLogado()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
    }
    ```

---

## 6. NullReferenceException Crítico em `UserBloqueioController` (Claim Incorreta) — [NOVO]

- **Arquivo:** `Controllers/UserBloqueioController.cs` (linhas 65 e 87)
- **Código com erro:**
    ```csharp
    [HttpGet("meus-bloqueios/empresas")]
    public async Task<IActionResult> GetEmpresasBloqueadas([FromQuery] string? busca)
    {
        try
        {
            // Pega o ID do usuário logado do Token (exemplo)
            int idUser = int.Parse(User.FindFirst("id").Value);
            // ...
    ```
- **Problema:** O método tenta ler a claim literal `"id"`. Porém, o JWT gerado e
  decodificado no sistema armazena a identificação do usuário na claim
  `ClaimTypes.NameIdentifier` (ou `"sub"`). Como a claim `"id"` não é mapeada e
  não existe no token, `User.FindFirst("id")` retorna `null`, e o acesso a
  `.Value` gera um erro crítico de `NullReferenceException`. Esse erro impede o
  carregamento da lista de bloqueios no frontend, resultando no erro HTTP 400
  Bad Request reportado pelo console.
- **Correção sugerida:** Substituir a consulta à claim pelo padrão correto
  (`ClaimTypes.NameIdentifier`):
    ```csharp
    int idUser = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
    ```
    _(Preferencialmente aplicando o null-check sugerido no item 5 para evitar
    quebras)._

---

## 7. Exposição global sem autorização no `zTemporarioController` — [NOVO]

- **Arquivo:** `Controllers/zTemporarioController.cs`
- **Problema:** O controller está desprotegido (não possui o atributo
  `[Authorize]`). Ele expõe endpoints para fins de desenvolvimento que revelam
  dados confidenciais do banco de dados, tais como:
    - `/api/zTemporario/dev/lista-usuarios`: Retorna todos os usuários (Nome,
      CPF, E-mail, Status).
    - `/api/zTemporario/dev/lista-empresas`: Retorna a lista de todas as
      empresas cadastradas.
    - `/api/zTemporario/dev/lista-assinatura`: Retorna as assinaturas do
      sistema.

    Qualquer atacante anônimo pode enviar requisições HTTP para esses endpoints
    e obter as listagens completas.

- **Correção sugerida:** Adicionar `[Authorize(Roles = "Admin")]` ao controller
  ou restringir seu acesso apenas em ambientes de desenvolvimento
  (`if (env.IsDevelopment())`) desativando o mapeamento das rotas em produção no
  arquivo `Program.cs`.

---

## 8. Compilação e Warnings de Nulidade (CS8602)

- **Status de compilação:** Aprovado (0 erros, 384 avisos de desreferência
  nula).
- **Análise:** O alto volume de avisos `CS8602` do compilador (especialmente no
  mapeamento das cobranças em `CobrancasController.cs` e navegação de classes em
  `ProdutosController.cs` / `CategoriasController.cs`) reflete a falta de
  verificações robustas antes de acessar dados que podem vir vazios ou nulos do
  Entity Framework Core. Isso eleva significativamente a probabilidade de falhas
  e erros `500 Internal Server Error` no ambiente de execução de produção caso o
  banco de dados possua inconsistências.

---

## 9. Bug Lógico de Validação no Cadastro de Assinatura — [NOVO]

- **Arquivo:** `Controllers/AssinaturaController.cs` (linhas 44–48)
- **Código com erro:**
    ```csharp
    var usuario = await _context.UserEmpresas.Where(s=>s.IdEmpresa==vinculo.IdEmpresa && s.IdUser==idAdmin).FirstOrDefaultAsync();
    if (usuario==null || usuario.Status == UserStatus.Inativo)
    {
        return BadRequest("Não é possível gerar assinaturas para usuários com cadastro inativo ou pendente.");
    }
    ```
- **Problema:** O código quer validar se o cliente da assinatura (`dto.IdUser`)
  está Ativo antes de criar a assinatura. Porém, o filtro busca por
  `s.IdUser == idAdmin` (que é o ID do administrador logado). Isso faz com que a
  API valide o status do próprio administrador que cria a assinatura, permitindo
  que assinaturas sejam cadastradas para clientes suspensos/inativos sem
  validação.
- **Correção sugerida:** Substituir `idAdmin` por `dto.IdUser` na consulta ao
  banco de dados:
    ```csharp
    var usuario = await _context.UserEmpresas.Where(s=>s.IdEmpresa==vinculo.IdEmpresa && s.IdUser==dto.IdUser).FirstOrDefaultAsync();
    ```

---

## 10. IDOR Crítico em Configurações de Assinatura (Exposição e Edição de Dados) — [NOVO]

- **Arquivo:** `Controllers/NotificacaoController.cs` (linhas 128–145)
- **Código com erro:**

    ```csharp
    [HttpGet("{id}/assinatura")]
    public async Task<IActionResult> GetConfigs(int id)
    {
        var configs = await _userService.GetAssinaturaConfigsAsync(id);
        if (configs == null) return NotFound(new { message = "Configurações não encontradas..." });
        return Ok(configs);
    }

    [HttpPatch("{id}/assinatura")]
    public async Task<IActionResult> UpdateConfigs(int id, [FromBody] AssinConfigsUpdateDto dto)
    {
        var sucesso = await _userService.UpdateAssinaturaConfigsAsync(id, dto);
        // ...
    ```

- **Problema:** Estes endpoints estão expostos publicamente (não contêm o
  atributo `[Authorize]`). Qualquer cliente ou atacante pode ler e editar
  configurações confidenciais de qualquer assinatura (Notificações, status,
  permissões, etc.) simplesmente passando o ID da assinatura desejada.
- **Correção sugerida:** Adicionar `[Authorize]` e aplicar verificações na
  camada do serviço para validar se o usuário autenticado é o dono da assinatura
  ou o administrador da empresa correspondente.

---

## 11. Restrição de Acesso Indevida a Detalhes do Plano — [NOVO]

- **Arquivo:** `Controllers/PlanoController.cs` (linha 95)
- **Código com erro:**
    ```csharp
    [HttpGet("{idPlano}")]
    public async Task<IActionResult> GetPlano(int idPlano)
    ```
- **Problema:** O controller inteiro possui o atributo
  `[Authorize(Roles = "Admin")]` no escopo da classe. Isso herda a exigência da
  role Admin para todos os métodos. Porém, o endpoint
  `GET /api/v1/Plano/{idPlano}` é necessário para que a UI carregue os detalhes
  do plano quando um cliente normal ("Cliente") tenta assinar ou visualizar a
  oferta. Do modo atual, a API retorna `403 Forbidden` a clientes logados
  comuns.
- **Correção sugerida:** Adicionar `[AllowAnonymous]` (ou pelo menos um
  `[Authorize]` que permita qualquer role autenticada) no método:
    ```csharp
    [HttpGet("{idPlano}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlano(int idPlano)
    ```

---

## 12. Falha de Design no Retorno de Cadastro de Endereço — [NOVO]

- **Arquivo:** `Controllers/EnderecoController.cs` (linhas 23–49)
- **Problema:** O método `CreateEndUser` (`POST /api/v1/Endereco/usuario`) cria
  o endereço no banco e na tabela associativa, mas retorna apenas uma mensagem
  de texto simples `return Ok("Endereço criado com sucesso!");` sem o ID do
  endereço gerado. Como a API não expõe uma rota de `GET` para recuperar os
  endereços do usuário logado, o frontend fica impedido de saber qual ID foi
  gerado para realizar alterações subsequentes (`PATCH /api/v1/Endereco/{id}`).
- **Correção sugerida:** Alterar o retorno do POST para fornecer o ID e os dados
  do endereço recém-criados:
    ```csharp
    return Ok(new { idEndereco = endereco.IdEndereco, message = "Endereço criado com sucesso!" });
    ```
