FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_ROOT_USER_ACTION=ignore

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --root-user-action=ignore -r requirements.txt

COPY . /app

EXPOSE 10000

CMD ["sh", "-c", "python manage.py migrate && python manage.py collectstatic --noinput && python manage.py ensure_admin && python manage.py seed_productos && python manage.py shell -c \"from carpinteria.models import Categoria, Producto, Pedido; from django.contrib.auth.models import User; print('DB_COUNTS categorias=%s productos=%s pedidos=%s users=%s' % (Categoria.objects.count(), Producto.objects.count(), Pedido.objects.count(), User.objects.count())); print('DB_CATEGORY_SLUGS', list(Categoria.objects.order_by('slug').values_list('slug', flat=True)))\" && gunicorn carpinteria.wsgi:application --bind 0.0.0.0:${PORT:-10000}"]
