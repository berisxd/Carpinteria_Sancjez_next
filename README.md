# Carpinteria Sanchez

Aplicacion Django para catalogo de productos de carpinteria, cotizaciones, pedidos y panel administrativo.

## Requisitos

- Python 3.12+
- PostgreSQL (produccion) o SQLite (desarrollo)

## Configuracion rapida local

1. Crear entorno virtual:
   - `python -m venv .venv`
2. Activar entorno virtual.
3. Instalar dependencias:
   - `pip install -r requirements.txt`
4. Ejecutar migraciones:
   - `python manage.py migrate`
5. Crear/actualizar admin por variables de entorno (opcional):
   - `python manage.py ensure_admin`
6. Levantar servidor:
   - `python manage.py runserver`

## Variables de entorno importantes

- `DATABASE_URL`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `ALLOWED_HOSTS`
- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

## Comandos de mantenimiento

- Poblar catalogo base:
  - `python manage.py seed_productos`
- Revisar productos cargados:
  - `python manage.py check_productos`
- Crear un producto de prueba:
  - `python manage.py create_test_producto`
- Migrar datos de SQLite a SQL:
  - `python manage.py migrate_sqlite_to_sql --source db.sqlite3 --flush-target`

## Estructura del proyecto

- `carpinteria/`: app principal (modelos, vistas, forms, settings, comandos)
- `templates/`: vistas HTML
- `static/`: css/js/imagenes
- `tests/`: pruebas automatizadas
- `scripts/`: scripts auxiliares de mantenimiento de assets
- `Dockerfile`: despliegue por contenedor
- `render.yaml`: blueprint opcional para Render
