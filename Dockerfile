FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_ROOT_USER_ACTION=ignore

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --root-user-action=ignore -r requirements.txt

COPY . /app

EXPOSE 10000

CMD ["sh", "-c", "python manage.py check --database default && python manage.py migrate && python manage.py ensure_admin && gunicorn carpinteria.wsgi:application --bind 0.0.0.0:${PORT:-10000}"]
