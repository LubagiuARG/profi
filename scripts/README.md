# Scripts

Utilidades para el monorepo. **No es código de la app**, son herramientas internas.

## `import-backlog.mjs`

Importa `docs/backlog/backlog.csv` a GitHub Issues + GitHub Project.

### Qué hace
- Crea labels que falten (`P0`–`P3` + temáticas: `backend`, `frontend`, `leads`, `verificacion`, `seguridad`, etc.)
- Para tareas `BE-*` y `FE-*` → crea **issues** en `gonzalo2309/profi`
- Para tareas `OP-*` (producto) → crea **draft items** en el Project (no quedan como issues del repo de código, así no contamina)
- Agrega todos los items al GitHub Project que le pases

### Pre-requisitos

1. **`gh` CLI instalado y autenticado**
   ```bash
   winget install --id GitHub.cli
   gh auth login
   ```

2. **GitHub Project creado en tu cuenta**
   - github.com → tu avatar → **Your projects** → **New project**
   - Tipo: "Table" (recomendado para ver todo de un vistazo)
   - Nombre: "Profi MVP" (o el que quieras)
   - Tras crearlo, anotá el **número del Project** que aparece en la URL: `github.com/users/gonzalo2309/projects/<NUMBER>`

3. **(Opcional) Vincular el repo al Project**
   En el Project → Settings (engranaje) → **Workflows** → **Auto-add to project** → activar y apuntar a `gonzalo2309/profi`. Así los issues nuevos caen al board automáticamente.

### Cómo correrlo

Desde la **raíz del monorepo** (`C:/Repos/Codelynx/profi`):

```bash
node scripts/import-backlog.mjs <PROJECT_NUMBER>
```

Ejemplo si tu Project es el #1:
```bash
node scripts/import-backlog.mjs 1
```

### Qué esperar
- Salida tipo:
  ```
  Importando 80 tareas a gonzalo2309/profi y al Project #1...
  Creando/actualizando 32 labels...
  Labels OK.

  ✓ BE-001  https://github.com/gonzalo2309/profi/issues/1
  ✓ BE-002  https://github.com/gonzalo2309/profi/issues/2
  ...
  ✓ OP-007  (draft) Plan de soporte mínimo
  ...
  Resumen: 80 OK · 0 fallidos · total 80
  ```
- Tarda ~2–3 minutos (hay sleep implícito por rate limit de GitHub)
- Si fallan algunos por rate limit, esperá un par de minutos y volvé a correrlo (cuidado con duplicados — `gh issue create` no es idempotente)

### Custom fields del Project (opcional, post-import)

Si querés agrupar/filtrar más fino, agregá custom fields al Project:
- **Priority** (single select): P0, P1, P2, P3
- **Repo** (single select): backend, frontend, producto
- **Tipo** (single select): feature, bug, chore, docs

Como los issues ya vienen con labels (`P0`, `backend`, etc.), podés:
- Filtrar por label sin necesidad de custom fields
- O setear los custom fields en bulk con la vista de tabla del Project

### Re-ejecución
**No es idempotente.** Si lo corrés dos veces, vas a tener issues duplicados. Si tenés que reintentar:
1. Borrar los issues que se hayan creado (con `gh issue list --repo gonzalo2309/profi --state open --json number --jq '.[].number' | xargs -I{} gh issue delete --repo gonzalo2309/profi {} --yes`)
2. Borrar los draft items del Project (a mano)
3. Volver a correr el script
