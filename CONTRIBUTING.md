# Flujo Git

## Ramas permanentes

- `develop`: rama central de integración. Todas las funcionalidades parten de aquí.
- `staging`: ambiente de desarrollo y validación integrada.
- `release/main`: ambiente de QA y preparación de versiones.
- `prod`: código desplegable en producción.
- `main`: punto inicial y referencia estable del repositorio.

## Funcionalidades

Las funcionalidades se crean desde `develop` usando `feat/<descripcion>`:

```bash
git switch develop
git pull --ff-only
git switch -c feat/new-module
```

Al terminar, la funcionalidad vuelve a `develop` mediante pull request.

## Promoción

El código se promueve mediante pull requests en este orden:

```text
develop -> staging -> release/main -> prod
```

## Hotfixes

Los arreglos urgentes parten de `prod` usando `hotfix/<descripcion>`:

```bash
git switch prod
git pull --ff-only
git switch -c hotfix/fixed-button
```

Después de publicar el arreglo en `prod`, debe propagarse a `release/main`,
`staging` y `develop` para mantener todas las líneas sincronizadas.
