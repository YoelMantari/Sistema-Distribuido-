from pydantic import BaseModel, Field
from typing import List

class Registro(BaseModel):
    """
    Esquema del mensaje que recibimos de la cola 'registro.nuevo'.
    Los campos corresponden exactamente a lo que envía el cliente:
      - nombre: str
      - correo: str
      - clave: str
      - dni: str
      - telefono: str
      - amigos: List[str] (lista de DNI de amigos)
    """
    nombre: str = Field(..., example="fulano")
    correo: str = Field(..., example="fulano@memail.com")
    clave: str = Field(..., example="1234")
    dni: str = Field(..., min_length=8, max_length=8, example="20453629")
    telefono: str = Field(..., example="89674539")
    amigos: List[str] = Field(default_factory=list, example=["12345678", "87654321"])
