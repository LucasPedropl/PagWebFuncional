# Diretrizes e Arquitetura do Backend - PagWeb (Pasta /api)

Este documento fornece uma análise detalhada e profunda da arquitetura do Backend do projeto **PagWeb**, localizado na pasta `/api`. A API foi desenvolvida em **ASP.NET Core (C#)** e expõe serviços RESTful para a gestão de usuários, assinaturas, pagamentos e empresas.

---

## 1. Stack Tecnológica do Backend
* **Runtime**: .NET Core (ASP.NET Core Web API).
* **ORM / Banco de Dados**: Entity Framework Core com provedor Microsoft SQL Server (`Microsoft.EntityFrameworkCore.SqlServer`).
* **Autenticação**: JWT Bearer Authentication (`Microsoft.AspNetCore.Authentication.JwtBearer`).
* **Documentação de API**: Swagger / OpenAPI (`Swashbuckle.AspNetCore`).
* **Geração de PDF**: QuestPDF (`QuestPDF`) sob licença comunitária.
* **Mensageria**: Integração com API externa do WhatsApp (templates e controle de disparos) e envio de e-mails via SMTP.

---

## 2. Padrões de Arquitetura e Organização
A API adota uma estrutura em camadas dentro do projeto principal `PagWebV1`:

* **`Controllers/`**: Expõem endpoints RESTful em `api/v1/[controller]`. A maioria das ações requer autenticação JWT com controle de acessos baseados em papéis (`[Authorize(Roles = "Admin")]` ou `[Authorize]`).
* **`Data/`**: Contém o `AppDbContext.cs`, configurando tabelas, relacionamentos (como a tabela pivot `UserEmpresa`) e chaves primárias/estrangeiras do SQL Server. A string de conexão (`DBPrintWEB`) é parametrizada no `appsettings.json`.
* **`Dtos/`**: Objetos de transferência de dados (DTOs) que blindam as entidades do banco e validam os payloads de entrada/saída (ex: `UserRegistrationDto`, `AssinaturaCreateDto`, `PlanoCreateDto`).
* **`Models/`**: Classes POCO que espelham o schema do banco de dados (entidades físicas como `User`, `Empresa`, `Plano`, `Assinatura`, `Mensalidade`, `Pagamento`, `CartaoCredito`, `Notificacoes`, `WhatsApp`).
* **`Services/`**: Implementam a lógica de negócios e as regras transacionais:
  * `UserService.cs` (Interface `IUserService.cs`): O cérebro do backend. Implementa o registro, login, ativação por e-mail, criação e desvinculação de conexões diretas entre clientes e estabelecimentos, bloqueios mútuos, cálculo e geração de mensalidades.
  * `AuthService.cs.cs`: Integra a autenticação local com a API de pagamentos externa da BixS (`https://api.bixs.com.br/v1/auth/login`).
  * `PDFGeneretorService.cs`: Lida com a criação de relatórios financeiros e contratos em formato PDF a partir de templates usando QuestPDF.
* **`Workers/`**: Background Services herdando de `BackgroundService` que executam tarefas periódicas agendadas no servidor:
  * `MensalidadeAtrasadaWorker`: Executado uma vez a cada 24 horas, aciona `userService.CobrancaMensalidadesAtrasadasAsync()` para identificar e processar mensalidades em atraso.
  * `MensalidadeNotifierService`: Dispara notificações e lembretes aos clientes sobre vencimento de mensalidades.
  * `TokenRefreshWorker` (no arquivo `Services/Interface.cs`): Responsável por atualizar o token de integração com a BixS API no `TokenStorage` a cada 24 horas.

---

## 3. Fluxos de Destaque no Backend

### A. Fluxo de Ativação do Usuário
* Ao registrar-se (`RegisterAsync`), o usuário é cadastrado com status inativo.
* Um token numérico de 6 dígitos é gerado e enviado para o e-mail do usuário (ou gerado e retornado em logs de desenvolvimento).
* O usuário insere o token no frontend, que chama `AtivacaoUser(email, token)`. O backend valida o token, ativa o usuário e altera o status da conta.

### B. Gestão de Planos, Contratos e Assinaturas
* **Planos**: Criados por administradores. Permitem anexar um arquivo de contrato físico (PDF/DOCX), que é salvo localmente em `wwwroot/empresas/{idEmpresa}/contratos/` e seu caminho relativo é registrado no banco de dados.
* **Assinaturas**: Representam o vínculo ativo entre um cliente e um plano da empresa.
* **Mensalidades**: Geradas a partir das assinaturas. O sistema possui rotinas recorrentes (`GerarMensalidadesRecorrentesAsync`) que geram faturas futuras baseadas no dia de pagamento configurado na assinatura.

### C. Integração BixS e Token Storage
* O backend consome serviços de pagamento externos da BixS.
* Para evitar chamadas repetitivas de login e otimizar a performance, o backend possui uma classe Singleton em memória `TokenStorage` que guarda o token de autorização atualizado.
* O `TokenRefreshWorker` roda em segundo plano e renova esse token automaticamente a cada 24 horas.

---

## 4. Ordem e Regras dos Middlewares (`Program.cs`)
A ordem de registro de middlewares é estrita para garantir a segurança dos endpoints:
1. `UseSwagger` e `UseSwaggerUI` (expondo Swagger na raiz `/` em modo Desenvolvimento).
2. `UseStaticFiles` (para servir arquivos de imagem e contratos na pasta `wwwroot`).
3. `UseCors` (liberação total de origens, métodos e headers para simplificar chamadas locais e remotas do frontend).
4. `UseHttpsRedirection`.
5. `UseAuthentication` (valida o token JWT no header das requisições).
6. `UseAuthorization` (valida os perfis `Admin` / `User`).
7. `MapControllers`.
