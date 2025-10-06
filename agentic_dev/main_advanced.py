# agentic_dev/main_advanced.py
"""
Sistema avanzado con múltiples agentes especializados
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

from config import Config
from tools.mysql_tool import (
    buscar_servicios_fuzzy, 
    mapear_servicios_desde_lista,
    buscar_con_similitud,
    obtener_estructura_tabla
)
from agents.data_analyzer import crear_agente_analista, crear_agente_optimizador

def crear_agente_buscador():
    """Agente especializado en buscar y mapear servicios"""
    
    system_message = """Eres un Agente especializado en mapear servicios médicos a IDs de base de datos.

CONTEXTO:
- Base de datos: medicalcare (MySQL)
- Tabla principal: tipoServicio (contiene todos los servicios con IDs y precios)

TUS HERRAMIENTAS:
1. buscar_servicios_fuzzy(termino_busqueda: str) -> str
2. mapear_servicios_desde_lista(lista_servicios: list) -> str
3. buscar_con_similitud(termino: str, umbral: float = 0.6) -> str
4. obtener_estructura_tabla(tabla: str) -> str

TAREA:
- Mapea cada servicio a su ID en la base de datos
- Usa búsqueda fuzzy si no encuentras exacto
- Documenta servicios no encontrados
- Proporciona estructura de tablas cuando sea necesario
"""

    model_client = OpenAIChatCompletionClient(
        model="deepseek-chat",
        api_key=Config.DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com",
        model_info={
            "vision": False,
            "function_calling": True,
            "json_output": True,
            "family": "unknown",
        }
    )
    
    agent = AssistantAgent(
        name="BuscadorServicios",
        model_client=model_client,
        system_message=system_message,
        tools=[
            buscar_servicios_fuzzy,
            mapear_servicios_desde_lista,
            buscar_con_similitud,
            obtener_estructura_tabla,
        ],
    )
    
    return agent

async def flujo_completo_mapeo(archivo_txt: str):
    """
    Flujo completo con múltiples agentes:
    1. Buscador: Mapea servicios
    2. Analista: Analiza resultados
    3. Optimizador: Sugiere mejoras
    """
    
    archivo_path = Path(archivo_txt)
    if not archivo_path.exists():
        print(f"❌ Archivo no encontrado: {archivo_txt}")
        return
    
    with open(archivo_path, 'r', encoding='utf-8') as f:
        servicios = [linea.strip() for linea in f if linea.strip()]
    
    print(f"🏥 Sistema Avanzado de Agentes - Medical&Care")
    print("=" * 60)
    print(f"📋 Servicios a procesar: {len(servicios)}")
    print("=" * 60)
    
    # Crear equipo de agentes
    buscador = crear_agente_buscador()
    analista = crear_agente_analista()
    optimizador = crear_agente_optimizador()
    
    team = RoundRobinGroupChat([buscador, analista, optimizador])
    
    # Mensaje inicial para el flujo
    mensaje = f"""
OBJETIVO: Procesar y analizar servicios de odontología

DATOS DE ENTRADA:
{json.dumps(servicios, ensure_ascii=False, indent=2)}

FLUJO DE TRABAJO:

AGENTE BUSCADOR:
1. Mapea cada servicio a su ID en la base de datos
2. Usa mapear_servicios_desde_lista() primero
3. Para servicios no encontrados, usa buscar_con_similitud()
4. Proporciona resumen de mapeo

AGENTE ANALISTA:
1. Analiza los resultados del mapeo
2. Identifica patrones en los servicios
3. Sugiere categorizaciones
4. Proporciona insights sobre la estructura de servicios

AGENTE OPTIMIZADOR:
1. Basado en el análisis, sugiere mejoras
2. Propone optimizaciones en precios o categorías
3. Sugiere paquetes o combinaciones de servicios
4. Recomienda estrategias de crecimiento

COLABORACIÓN: Trabajen juntos para completar el análisis completo.
"""
    
    print("\n🤖 Iniciando equipo de agentes...")
    print("   - BuscadorServicios: Mapeo de servicios")
    print("   - AnalistaDatosMedicos: Análisis de datos")
    print("   - OptimizadorServicios: Optimización")
    print("\n" + "=" * 60)
    
    try:
        stream = team.run_stream(task=mensaje)
        await Console(stream)
        
        print("\n" + "=" * 60)
        print("✅ Flujo completo completado")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error en flujo completo: {e}")
        import traceback
        traceback.print_exc()

async def analisis_estructura():
    """Análisis de la estructura de la base de datos"""
    
    print("🏥 Análisis de Estructura - Medical&Care")
    print("=" * 60)
    
    # Crear equipo de agentes
    buscador = crear_agente_buscador()
    analista = crear_agente_analista()
    
    team = RoundRobinGroupChat([buscador, analista])
    
    mensaje = """
OBJETIVO: Analizar la estructura de la base de datos medicalcare

TAREAS:
1. Obtener estructura de tablas principales
2. Analizar relaciones entre tablas
3. Identificar oportunidades de normalización
4. Sugerir mejoras en el esquema

TABLAS PRINCIPALES A ANALIZAR:
- tipoServicio
- doctores
- especialidades
- citas
- pacientes

PROCESO:
1. Usar obtener_estructura_tabla() para cada tabla
2. Analizar campos y tipos de datos
3. Identificar relaciones y dependencias
4. Proponer mejoras en el diseño
"""
    
    print("\n🤖 Iniciando análisis de estructura...")
    
    try:
        stream = team.run_stream(task=mensaje)
        await Console(stream)
        
        print("\n" + "=" * 60)
        print("✅ Análisis de estructura completado")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error en análisis de estructura: {e}")
        import traceback
        traceback.print_exc()

def ejecutar_flujo_completo(archivo_txt: str):
    """Wrapper síncrono para flujo completo"""
    return asyncio.run(flujo_completo_mapeo(archivo_txt))

def ejecutar_analisis_estructura():
    """Wrapper síncrono para análisis de estructura"""
    return asyncio.run(analisis_estructura())

if __name__ == "__main__":
    print("🏥 Sistema Avanzado de Agentes - Medical&Care")
    print("=" * 60)
    print("1. Flujo completo de mapeo y análisis")
    print("2. Análisis de estructura de base de datos")
    print("=" * 60)
    
    opcion = input("Selecciona una opción (1 o 2): ").strip()
    
    if opcion == "1":
        archivo_servicios = "servicios_odontologia.txt"
        
        if not Path(archivo_servicios).exists():
            print(f"⚠️  Creando archivo de ejemplo: {archivo_servicios}")
            servicios_ejemplo = [
                "Extracción dental simple",
                "Limpieza dental",
                "Ortodoncia inicial",
                "Blanqueamiento dental",
                "Endodoncia",
                "Resina dental",
                "Corona dental",
                "Implante dental",
                "Prótesis dental"
            ]
            with open(archivo_servicios, 'w', encoding='utf-8') as f:
                f.write('\n'.join(servicios_ejemplo))
            print(f"✅ Archivo creado\n")
        
        ejecutar_flujo_completo(archivo_servicios)
        
    elif opcion == "2":
        ejecutar_analisis_estructura()
        
    else:
        print("❌ Opción no válida")
