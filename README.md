# Hyperlink Editor

Editor focado em gerar e editar o `data.json` do Hyperlink diretamente no navegador.

## Como usar

1. Use a versão online no GitHub Pages:
   - `https://srshadowy.github.io/hyperlink/editor.html`
2. Se já tiver `data.json`, carregue o arquivo na aba **JSON Final** usando **Carregar JSON**.
3. Edite:
   - Perfil
   - Redes sociais
   - Pastas e links diretos
4. A preview ao lado mostra como o perfil ficará.
5. Quando terminar:
   - Use **Copiar** para copiar o JSON final
   - Use **Download data.json** para baixar apenas o arquivo de dados
   - Use **Download Pacote Completo** se quiser o projeto pronto para publicação

## Estrutura do projeto

- `index.html` — página pública que exibe o perfil gerado
- `editor.html` — interface de edição do JSON
- `resources/data.json` — arquivo de dados usado pelo site
- `resources/script/editor.js` — lógica do editor
- `resources/script/main.js` — renderiza a página pública
- `resources/style/editor.css` — estilos do editor
- `resources/style/style.css` — estilos da página pública
- `resources/icons/` — ícones personalizados usados pelo perfil

## O que o usuário precisa para usar

- Não é preciso baixar o projeto inteiro para editar.
- Você pode usar a página `editor.html` hospedada no GitHub Pages.
- Para o seu próprio Hyperlink, basta copiar:
  - `index.html`
  - `resources/style/style.css`
  - `resources/script/main.js`
  - `resources/script/utils.js`
- Depois, coloque:
  - `resources/data.json`
  - `resources/icons/` com seus ícones

## Fluxo de edição

- O editor salva automaticamente no `localStorage`
- Se houver rascunho local, ele abre a partir dele
- Você também pode carregar qualquer JSON válido manualmente
- O editor reconhece formatos antigos e faz migração automática para o novo modelo

## Para publicar

1. Gere ou copie o JSON na aba **JSON Final**
2. Salve como `resources/data.json`
3. Coloque os ícones em `resources/icons/`
4. Publique os arquivos mínimos em seu site:
   - `index.html`
   - `resources/style/style.css`
   - `resources/script/main.js`
   - `resources/script/utils.js`
   - `resources/data.json`
   - `resources/icons/`

## Notas importantes

- A preview do editor tenta refletir o mesmo visual do `index.html`
- `resources/icons/` é a pasta onde você pode adicionar ícones personalizados
- Use `data.json` no formato atual para evitar ajustes manuais

## Dica rápida

Sempre mantenha uma cópia externa do `data.json`. Carregar JSON manualmente no editor evita perder alterações se o projeto for atualizado.
