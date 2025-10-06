# agentic_dev/agents/data_analyzer.py
"""
Agente especializado en análisis de datos médicos
"""

from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient
from config import Config

def crear_agente_analista():
    """
    Crea un agente especializado en análisis de datos médicos
    """
    
    system_message = """Eres un Analista de Datos Médicos especializado en Medical&Care.

CONTEXTO:
- Base de datos: medicalcare (MySQL)
- Tablas principales: tipoServicio, doctores, especialidades, citas
- Sistema de turnos médicos

TUS CAPACIDADES:
1. Analizar tendencias en servicios médicos
2. Identificar servicios más populares
3. Analizar distribución de precios
4. Generar insights sobre especialidades
5. Proponer mejoras basadas en datos

OBJETIVOS:
- Proporcionar análisis cuantitativo de servicios
- Identificar oportunidades de optimización
- Generar reportes basados en datos reales
- Sugerir mejoras en la estructura de servicios
"""

    # Usar DeepSeek para análisis
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
    
    # Crear agente analista
    agente = AssistantAgent(
        name="AnalistaDatosMedicos",
        model_client=model_client,
        system_message=system_message,
        tools=[],  # Por ahora sin herramientas específicas
    )
    
    return agente

def crear_agente_optimizador():
    """
    Crea un agente especializado en optimización de servicios
    """
    
    system_message = """Eres un Especialista en Optimización de Servicios Médicos.

CONTEXTO:
- Sistema de turnos Medical&Care
- Base de datos con servicios, precios y especialidades
- Objetivo: Mejorar eficiencia y rentabilidad

TUS CAPACIDADES:
1. Analizar estructura de precios
2. Identificar servicios subutilizados
3. Sugerir paquetes de servicios
4. Optimizar horarios y recursos
5. Proponer estrategias de crecimiento

ENFOQUE:
- Basado en datos reales del sistema
- Considerando necesidades de pacientes
- Manteniendo calidad del servicio
- Maximizando eficiencia operativa
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
    
    agente = AssistantAgent(
        name="OptimizadorServicios",
        model_client=model_client,
        system_message=system_message,
        tools=[],
    )
    
    return agente

# Test del módulo
if __name__ == "__main__":
    print("🧪 Probando agentes de análisis...")
    
    try:
        analista = crear_agente_analista()
        optimizador = crear_agente_optimizador()
        
        print("✅ Agentes de análisis creados correctamente")
        print(f"   - {analista.name}")
        print(f"   - {optimizador.name}")
        
    except Exception as e:
        print(f"❌ Error creando agentes: {e}")
        import traceback
        traceback.print_exc()
