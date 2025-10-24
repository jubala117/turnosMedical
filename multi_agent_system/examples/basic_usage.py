"""
Ejemplo básico de uso del Multi-Agent System

Este ejemplo muestra cómo:
1. Configurar el sistema
2. Crear agentes especializados
3. Usar el orquestador
4. Delegar tareas
"""
import sys
import os

# Agregar el directorio padre (turnosMedical) al path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))  # turnosMedical/
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from multi_agent_system.core.orchestrator import Orchestrator
from multi_agent_system.agents.code_agent import CodeAgent
from multi_agent_system.agents.research_agent import ResearchAgent

# ========================================
# CONFIGURACIÓN DE MODELOS
# ========================================
# Cambia aquí para usar diferentes modelos

# OPCIÓN 1: GPT-4 (ACTIVA) - Ahorra tokens de Claude
ORCHESTRATOR_MODEL = "gpt-4o"
RESEARCH_MODEL = "gpt-4o"

# OPCIÓN 2: Claude (COMENTADA) - Descomenta cuando tengas más tokens
# ORCHESTRATOR_MODEL = "claude-sonnet-4-5-20250929"
# RESEARCH_MODEL = "claude-sonnet-4-5-20250929"

# Code Agent - DeepSeek es más barato y bueno para código
CODE_MODEL = "deepseek-chat"  # O usa "gpt-4o" si no tienes DeepSeek


def example_1_simple_orchestrator():
    """Ejemplo 1: Uso simple del orquestador sin agentes especializados"""
    print("\n" + "="*60)
    print("EJEMPLO 1: Orquestador Simple")
    print("="*60 + "\n")

    # Crear orquestador
    orchestrator = Orchestrator(model=ORCHESTRATOR_MODEL)

    # Hacer una pregunta simple
    response = orchestrator.chat("Lista los archivos en el directorio actual")
    print(f"\nRespuesta: {response}\n")


def example_2_with_code_agent():
    """Ejemplo 2: Orquestador con Code Agent"""
    print("\n" + "="*60)
    print("EJEMPLO 2: Orquestador + Code Agent")
    print("="*60 + "\n")

    # Crear orquestador
    orchestrator = Orchestrator(model=ORCHESTRATOR_MODEL)

    # Crear y registrar Code Agent
    code_agent = CodeAgent(model=CODE_MODEL)
    orchestrator.register_agent("code", code_agent)

    # El orquestador decidirá si delegar al code agent
    response = orchestrator.chat(
        "Busca todos los archivos Python en el directorio actual "
        "y muéstrame cuáles tienen la palabra 'class' en ellos"
    )
    print(f"\nRespuesta: {response}\n")


def example_3_with_research_agent():
    """Ejemplo 3: Orquestador con Research Agent"""
    print("\n" + "="*60)
    print("EJEMPLO 3: Orquestador + Research Agent")
    print("="*60 + "\n")

    # Crear orquestador
    orchestrator = Orchestrator(model=ORCHESTRATOR_MODEL)

    # Crear y registrar Research Agent
    research_agent = ResearchAgent(model=RESEARCH_MODEL)
    orchestrator.register_agent("research", research_agent)

    # Pedir análisis del proyecto
    response = orchestrator.chat(
        "Analiza la estructura de este proyecto y explica qué hace"
    )
    print(f"\nRespuesta: {response}\n")


def example_4_complete_system():
    """Ejemplo 4: Sistema completo con todos los agentes"""
    print("\n" + "="*60)
    print("EJEMPLO 4: Sistema Completo Multi-Agente")
    print("="*60 + "\n")

    # Crear orquestador (modelo principal)
    orchestrator = Orchestrator(model=ORCHESTRATOR_MODEL)

    # Registrar agentes especializados con diferentes modelos
    orchestrator.register_agent("code", CodeAgent(model=CODE_MODEL))
    orchestrator.register_agent("research", ResearchAgent(model=RESEARCH_MODEL))

    # Mostrar estado del sistema
    orchestrator.show_status()

    # Tarea compleja que puede requerir múltiples agentes
    print("💬 Ejecutando tarea compleja...")
    response = orchestrator.chat(
        "Explora este proyecto y genera un archivo README.md "
        "con la documentación básica del proyecto"
    )
    print(f"\nRespuesta: {response}\n")


def example_5_conversation():
    """Ejemplo 5: Conversación multi-turno"""
    print("\n" + "="*60)
    print("EJEMPLO 5: Conversación Multi-Turno")
    print("="*60 + "\n")

    orchestrator = Orchestrator(model=ORCHESTRATOR_MODEL)
    orchestrator.register_agent("code", CodeAgent(model=CODE_MODEL))

    # Conversación
    messages = [
        "¿Cuántos archivos Python hay en este proyecto?",
        "Ahora muéstrame el contenido del archivo principal",
        "¿Hay alguna función que deba ser refactorizada?"
    ]

    for msg in messages:
        print(f"\n👤 Usuario: {msg}")
        response = orchestrator.chat(msg)
        print(f"🤖 Asistente: {response}\n")


def example_6_direct_agent_usage():
    """Ejemplo 6: Uso directo de agentes (sin orquestador)"""
    print("\n" + "="*60)
    print("EJEMPLO 6: Uso Directo de Agentes")
    print("="*60 + "\n")

    # Usar Code Agent directamente
    code_agent = CodeAgent(model="deepseek-chat")

    response = code_agent.chat("Lee el archivo config/settings.py y explícalo")
    print(f"Code Agent: {response}\n")

    # Usar Research Agent directamente
    research_agent = ResearchAgent(model="gpt-4o")
    response = research_agent.explore_project(".")
    print(f"Research Agent: {response}\n")


def example_7_multi_model():
    """Ejemplo 7: Usando diferentes modelos para diferentes tareas"""
    print("\n" + "="*60)
    print("EJEMPLO 7: Multi-Modelo")
    print("="*60 + "\n")

    # Orquestador (coordinación principal)
    # OPCIÓN 1: GPT-4 (ACTIVA)
    orchestrator = Orchestrator(model="gpt-4o")

    # OPCIÓN 2: Claude (COMENTADA)
    # orchestrator = Orchestrator(model="claude-sonnet-4-5-20250929")

    # Code Agent con DeepSeek (especializado en código, más barato)
    code_agent = CodeAgent(model="deepseek-coder")
    orchestrator.register_agent("code", code_agent)

    # Research Agent - mismo modelo que orquestador
    research_agent = ResearchAgent(model="gpt-4o")  # O "claude-sonnet-4-5-20250929"
    orchestrator.register_agent("research", research_agent)

    orchestrator.show_status()

    # Cada agente usará su modelo especializado
    response = orchestrator.chat(
        "Analiza el código de este proyecto y sugiere mejoras"
    )
    print(f"\nRespuesta: {response}\n")


if __name__ == "__main__":
    print("\n🚀 Multi-Agent System - Ejemplos de Uso\n")

    # Ejecutar ejemplos (comenta los que no quieras ejecutar)
    # example_1_simple_orchestrator()
    # example_2_with_code_agent()
    # example_3_with_research_agent()
    # example_4_complete_system()
    # example_5_conversation()
    # example_6_direct_agent_usage()
    example_7_multi_model()

    print("\n✅ Ejemplos completados\n")
