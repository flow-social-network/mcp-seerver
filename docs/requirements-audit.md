# Requisitos versus estado real do ecossistema

Data da inspeção: 2026-10-12. Método: inspeção estática de árvores e ficheiros acessíveis via GitHub; não equivale a executar a aplicação, validar um ambiente implantado ou provar explorabilidade em produção.

## Decisão executiva

**Não considerar o MCP pronto para integração ou produção.** A fundação deste repositório é apenas um ponto de partida. A arquitetura deve continuar no repositório dedicado `mcp-seerver`, mas o servidor completo só pode ser implementado depois de definir e validar contratos reais do Core e resolver os bloqueadores de autenticação/autorização. Não criar uma segunda camada de negócio nem ligar ferramentas MCP diretamente ao banco de dados.

A inspeção encontrou capacidades existentes no Core, mas também rotas com respostas mock e padrões de identidade/isolamento que precisam de correção antes de expor essas operações via MCP.

## Evidências observadas

| Área | Evidência estática | Estado para MCP |
| --- | --- | --- |
| Repositório dedicado | Antes desta branch continha somente README; agora há uma fundação TypeScript/STDIO | Parcial |
| Protocolo MCP | O código regista ferramentas de saúde/configuração, sem ainda validar uma sessão completa com cliente real | Parcial; E2E pendente |
| Core: rota MCP | `api/src/http/routes/mcp.ts` devolve `mockMCP` em GET e POST e comenta que a persistência é TODO | Bloqueador para catálogo real de conexões |
| Core: tarefas | `api/src/http/routes/tasks.ts` usa `mockTasks`/`mockTask` em GET/POST/PATCH | Bloqueador para ferramentas de tarefas reais |
| Core: projetos | `api/src/http/routes/projects.ts` contém CRUD SQL, mas criação usa `user-1` fixo e as consultas exibidas não filtram por utilizador | Bloqueador de autorização/isolamento multiutilizador |
| Core: agentes | `api/src/http/routes/agents.ts` contém consultas reais, mas a criação usa `user-1` fixo; a rota de execução não vincula a consulta do agente ao ID pedido de forma evidente | Requer correção e testes de autorização antes da exposição |
| Core: evidências | `api/src/http/routes/evidence.ts` lê registos reais sem filtro de utilizador visível na consulta inspecionada | Bloqueador de isolamento até confirmação/correção |
| API Core | `api/src/http/server.ts` monta rotas diretamente; não foi observada autenticação global nesse ficheiro | Rever o caminho de autenticação no servidor implantado e proteger cada rota |
| Contratos | `packages/contracts/src/index.ts` já contém schemas Zod para projetos, agentes, evidências, saúde e respostas | Reutilizar, reconciliar nomes e validar schemas de entrada/saída |
| Orquestração | `packages/orchestration/src/index.ts` já contém runtime de agentes | Reutilizar através de interface/API; não duplicar runtime no MCP |
| Pacotes incompletos | `packages/workspace`, `readiness`, `security`, `shared`, `testing` e `vision` têm ficheiros `src/index.ts` vazios na árvore inspecionada | Verificar se são placeholders intencionais; não assumir funcionalidades implementadas |
| Workspace administrativo | O painel tem Better Auth e rotas de API que verificam sessão e filtram por utilizador em algumas operações | Não assumir que o backend do painel é intercambiável com a API Core; mapear os contratos e a fonte de verdade |
| Ferramentas de desenvolvimento | README de Noteagents-dev descreve CLI/runtime, mas existem placeholders no runtime e fontes duplicadas/artefactos `dist` na árvore | Auditoria própria necessária antes de expor operações de execução |
| Testes/CI | A CI inicial falhou na etapa de setup de Node; após remover cache sem lockfile, a nova execução foi disparada | Resultado de typecheck/test/build ainda precisa de ser confirmado |
| Dependências | Não existe lockfile na fundação inicial | Criar e versionar lockfile coerente com o package manager antes de release reprodutível |
| Transporte remoto | Só STDIO foi implementado | HTTP/OAuth/TLS/rate limits não implementados; não anunciar transporte remoto |
| Segurança MCP | Não há ainda autorização por ferramenta/projeto, auditoria de chamadas, integração Core autenticada ou teste de prompt injection | Bloqueador de produção |

## Matriz de requisitos de saída

| Requisito | Evidência mínima para aprovação | Estado |
| --- | --- | --- |
| MCP protocol | Cliente real executa initialize, tools/list e tools/call contra o processo | Pendente |
| Ferramentas reais | Cada ferramenta mapeia a contrato Core existente e retorna dados reais, nunca mocks | Pendente |
| Autenticação | Identidade verificada server-side e credenciais service-to-service seguras | Bloqueador |
| Autorização | Testes positivos/negativos e isolamento entre dois utilizadores/projetos | Bloqueador |
| Schemas | Zod/contratos partilhados para inputs, outputs e erros | Parcial |
| Limites operacionais | Timeout, cancelamento, paginação, limites de output/concurrency e rate limiting aplicáveis | Pendente |
| Auditoria | Registo estruturado de actor, ferramenta, projeto, decisão, resultado e correlação sem segredos | Pendente |
| Segurança de recursos | Controlo de caminhos/symlinks, SSRF, prompt injection, redacção e limites | Pendente |
| Transporte | STDIO funcional; HTTP só após autenticação e threat model | Parcial |
| Testes | Unit, protocol, contract, integration, negative security e E2E | Pendente |
| CI/reprodutibilidade | Lockfile, build limpo e pipeline verde | Pendente |
| Operação | Configuração de produção, health/readiness real, logs, alertas, runbook e rollback | Pendente |

## Decisão arquitetural

1. Manter o MCP server como adaptador fino no repositório dedicado.
2. Reutilizar os contratos e serviços reais do NoteAgents Core; não duplicar DB, agente runtime, Git service nem regras de negócio.
3. Não expor inicialmente operações de mutação, Git push/commit, escrita de ficheiros, execução de tarefas ou execução de agentes.
4. Tratar rotas com mocks e rotas sem isolamento explícito como não elegíveis para MCP até serem corrigidas e cobertas por testes.
5. Não ligar o MCP diretamente ao banco de dados ou ao painel administrativo.
6. Não marcar produção até que a matriz de saída esteja aprovada com links de CI, relatórios de teste e um teste real do cliente.

## Próximas ações obrigatórias

- [ ] Obter resultado final da CI desta branch e corrigir falhas reais.
- [ ] Adicionar lockfile e validar instalação limpa.
- [ ] Fazer inventário de todos os endpoints Core, middleware de autenticação e tabelas/escopos.
- [ ] Corrigir os bloqueadores de identidade e isolamento no Core antes de integrar ferramentas de leitura.
- [ ] Definir contratos versionados para ferramentas MCP e testes de contrato.
- [ ] Implementar cliente Core autenticado com allowlist de endpoints, timeout e limite de resposta.
- [ ] Testar initialize/tools/list/tools/call com um cliente MCP real.
- [ ] Aprovar cada ferramenta separadamente contra esta matriz.
