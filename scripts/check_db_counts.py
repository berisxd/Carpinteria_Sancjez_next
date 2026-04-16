import sqlite3

TABLES = [
    'carpinteria_categoria',
    'carpinteria_producto',
    'carpinteria_pedido',
    'carpinteria_cotizacion',
    'auth_user',
]

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()

for table in TABLES:
    try:
        count = cur.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]
        print(f'{table}: {count}')
    except Exception as exc:
        print(f'{table}: ERROR -> {exc}')

conn.close()
