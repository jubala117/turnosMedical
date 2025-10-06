# agentic_dev/main_simple.py
"""
Pipeline simple para mapear servicios de odontología
Versión para AutoGen 0.10+
"""
import asyncio
import json
from pathlib import Path

# Imports para AutoGen 0.10
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.ui import Console
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_core import ModelCapabilities  # ← NUEVO

from config import Config
from tools.mysql_tool import (
    buscar_servicios_fuzzy, 
    mapear_servicios_desde_lista,
    buscar_con_similitud
)

def crear_agente_buscador():
    """
    Agente especializado en buscar y mapear servicios
    """
    
    system_message = """Eres un Agente especializado en mapear servicios médicos a IDs de base de datos.

CONTEXTO:
- Base de datos: medicalcare (MySQL)
- Tabla principal: tipoServicio (contiene todos los servicios con IDs y precios)

TUS HERRAMIENTAS:
1. buscar_servicios_fuzzy(termino_busqueda: str) -> str
2. mapear_servicios_desde_lista(lista_servicios: list) -> str
3. buscar_con_similitud(termino: str, umbral: float = 0.6) -> str

TAREA:
- Mapea cada servicio a su ID en la base de datos
- Usa búsqueda fuzzy si no encuentras exacto
- Documenta servicios no encontrados
"""
    
    # CORRECCIÓN: Configuración corregida para DeepSeek
    model_client = OpenAIChatCompletionClient(
        model="deepseek-chat",
        api_key=Config.DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com",  # ← CORREGIDO: Sin /v1
        model_info={  # ← AGREGADO: Info del modelo
            "vision": False,
            "function_calling": True,
            "json_output": True,
            "family": "unknown",
        }
    )
    
    # Crear agente
    agent = AssistantAgent(
        name="BuscadorServicios",
        model_client=model_client,
        system_message=system_message,
        tools=[
            buscar_servicios_fuzzy,
            mapear_servicios_desde_lista,
            buscar_con_similitud,
        ],
    )
    
    return agent

async def mapear_odontologia_async(archivo_txt: str):
    """Función principal de mapeo"""
    
    archivo_path = Path(archivo_txt)
    if not archivo_path.exists():
        print(f"❌ Archivo no encontrado: {archivo_txt}")
        return
    
    with open(archivo_path, 'r', encoding='utf-8') as f:
        servicios = [linea.strip() for linea in f if linea.strip()]
    
    print(f"📋 Servicios a mapear: {len(servicios)}")
    print("="*60)
    
    # Crear agente
    agente = crear_agente_buscador()
    
    # Crear team
    team = RoundRobinGroupChat([agente])
    
    # Mensaje
    mensaje = f"""Mapea estos servicios de odontología:

{json.dumps(servicios, ensure_ascii=False, indent=2)}

PASOS:
1. Usa mapear_servicios_desde_lista() primero
2. Para no encontrados, usa buscar_con_similitud()
3. Muestra resumen final
"""
    
    print("\n🤖 Iniciando agente...\n")
    
    try:
        stream = team.run_stream(task=mensaje)
        await Console(stream)
        
        print("\n" + "="*60)
        print("✅ Mapeo completado")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

def mapear_odontologia(archivo_txt: str):
    """Wrapper síncrono"""
    return asyncio.run(mapear_odontologia_async(archivo_txt))

if __name__ == "__main__":
    print("🏥 Sistema de Mapeo de Servicios - Medical&Care")
    print("="*60)
    
    archivo_servicios = "servicios_odontologia.txt"
    
    if not Path(archivo_servicios).exists():
        print(f"⚠️  Creando archivo de ejemplo: {archivo_servicios}")
        servicios_ejemplo = [
            "Extracción dental simple",
            "Limpieza dental",
            "Ortodoncia inicial",
            "Blanqueamiento dental",
            "Endodoncia",
            "Resina dental"
        ]
        with open(archivo_servicios, 'w', encoding='utf-8') as f:
            f.write('\n'.join(servicios_ejemplo))
        print(f"✅ Archivo creado\n")
    
    mapear_odontologia(archivo_servicios)
