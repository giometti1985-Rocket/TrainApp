# TrainApp Fitness

App de fitness pessoal em React + Vite + TypeScript, com persistência local via IndexedDB/Dexie.

## O que já está incluído

- Abas: Hoje, Treino, Nutrição e Progresso
- Cadastro/edição/exclusão de exercícios
- Registro de séries, carga, repetições e esforço
- Sugestão local de progressão de carga baseada nas últimas sessões
- Sugestão local de substitutos por grupo muscular/equipamento
- Cadastro de refeições e controle diário
- Registro de proteína, água e suplementação
- Registro de medidas corporais
- Cálculo de IMC
- Estimativa de gordura corporal pela fórmula US Navy
- Meta mensal de treinos baseada em dias úteis
- Armazenamento local com IndexedDB via Dexie
- Sem Claude, sem Anthropic API e sem `window.storage`

## Requisitos

- Node.js 20+
- npm

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse a URL exibida no terminal.

## Build de produção

```bash
npm run build
npm run preview
```

## Publicar no GitHub

Crie um repositório vazio no GitHub, depois execute:

```bash
git init
git add .
git commit -m "Initial TrainApp Fitness"
git branch -M main
git remote add origin https://github.com/giometti1985-Rocket/TrainApp.git
git push -u origin main
```

## Publicar no GitHub Pages

1. Troque `SEU_USUARIO` no campo `homepage` do `package.json`.
2. Rode:

```bash
npm run deploy
```

O app será publicado em:

```txt
https://giometti1985-Rocket.github.io/TrainApp
```

## Observação sobre armazenamento

Os dados ficam somente no navegador do usuário, usando IndexedDB. Eles não são enviados para servidor externo.
