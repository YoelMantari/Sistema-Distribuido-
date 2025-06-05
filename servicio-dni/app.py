from fastapi import FastAPI
import threading
from src.dni_consumer import start_consumidor

app = FastAPI()

@app.get("/health")
async def health_check():
    """
    Endpoint de health-check para verificar que el servicio esté arriba.
    """
    return {"status": "UP"}

@app.on_event("startup")
def startup_event():
    """
    Al iniciar FastAPI, arrancamos un hilo de fondo que consuma mensajes de RabbitMQ.
    """
    thread = threading.Thread(target=start_consumidor, daemon=True)
    thread.start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000)
