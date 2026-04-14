import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'db.sqlite3')

NEW_URL = 'https://images.unsplash.com/photo-1637003833874-971d4da7eea6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fGFybWFyaW8lMjB6YXBhdGVyYXxlbnwwfHwwfHx8MA%3D%3D'
PRODUCT_NAME = 'Armario Zapatera'

if not os.path.exists(DB_PATH):
    print(f"ERROR: No se encontró la base de datos en {DB_PATH}")
    raise SystemExit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("UPDATE carpinteria_producto SET imagen = ? WHERE nombre = ?", (NEW_URL, PRODUCT_NAME))
conn.commit()

# Mostrar la URL actual para verificar
cur.execute("SELECT imagen FROM carpinteria_producto WHERE nombre = ?", (PRODUCT_NAME,))
row = cur.fetchone()
if row:
    print('Imagen actualizada correctamente:')
    print(row[0])
else:
    print('No se encontró el producto con nombre:', PRODUCT_NAME)

conn.close()