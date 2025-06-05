# 1) Usamos Python 3.11 slim como base
FROM python:3.11-slim

# 2) Variables para que Python no genere archivos .pyc y no bufferice salidas
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3) Directorio de trabajo
WORKDIR /app

# 4) Copiamos requirements e instalamos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5) Copiamos todo el código dentro de /app
COPY . .

# 6) Exponemos el puerto 8000 (FastAPI)
EXPOSE 8000

# 7) Comando por defecto para levantar FastAPI con Uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
