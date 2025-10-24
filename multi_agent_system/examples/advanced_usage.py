"""
Ejemplos avanzados del Multi-Agent System

Demuestra características avanzadas como:
- Creación de agentes personalizados
- Herramientas personalizadas
- Gestión de contexto
- Paralelización de tareas
"""
import sys
import os

# Agregar el directorio padre (turnosMedical) al path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))  # turnosMedical/
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from typing import Dict, Any, List
from multi_agent_system.core.orchestrator import Orchestrator
from multi_agent_system.core.base_agent import BaseAgent
from multi_agent_system.agents.code_agent import CodeAgent
from multi_agent_system.agents.research_agent import ResearchAgent
from multi_agent_system.tools.base_tool import BaseTool


# Ejemplo 1: Crear una herramienta personalizada
class CustomCalculatorTool(BaseTool):
    """Herramienta personalizada de calculadora"""

    def __init__(self):
        super().__init__(
            name="calculator",
            description="Realiza cálculos matemáticos básicos"
        )

    def execute(self, expression: str) -> str:
        """Evalúa una expresión matemática"""
        try:
            result = eval(expression)
            return f"Resultado: {result}"
        except Exception as e:
            return f"Error: {str(e)}"

    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Expresión matemática a evaluar (ej: '2 + 2', '10 * 5')"
                }
            },
            "required": ["expression"]
        }


# Ejemplo 2: Crear un agente personalizado
class MathAgent(BaseAgent):
    """Agente especializado en matemáticas"""

    def __init__(self, model: str = "gpt-4o", **kwargs):
        system_message = """Eres un agente especializado en matemáticas.

Puedes realizar cálculos matemáticos complejos usando la herramienta calculator.
Explica tus pasos y proporciona resultados claros."""

        tools = [CustomCalculatorTool()]

        super().__init__(
            name="MathAgent",
            model=model,
            system_message=system_message,
            tools=tools,
            temperature=0.2,
            max_tokens=2048
        )

    def get_capabilities(self) -> List[str]:
        return ["Cálculos matemáticos", "Resolución de ecuaciones"]


def example_custom_agent():
    """Ejemplo: Usar un agente personalizado"""
    print("\n" + "="*60)
    print("EJEMPLO AVANZADO 1: Agente Personalizado")
    print("="*60 + "\n")

    # Crear orquestador
    orchestrator = Orchestrator()

    # Crear y registrar agente de matemáticas
    math_agent = MathAgent()
    orchestrator.register_agent("math", math_agent)

    # Usar el agente
    response = orchestrator.chat("Calcula cuánto es 123 * 456 + 789")
    print(f"\nRespuesta: {response}\n")


def example_context_management():
    """Ejemplo: Gestión de contexto"""
    print("\n" + "="*60)
    print("EJEMPLO AVANZADO 2: Gestión de Contexto")
    print("="*60 + "\n")

    # Crear agente con límite de contexto pequeño para demostración
    code_agent = CodeAgent()

    # Conversación larga
    for i in range(10):
        response = code_agent.chat(f"Paso {i}: Cuéntame algo sobre Python")
        print(f"Mensaje {i}: {response[:100]}...")

    # Mostrar estado del contexto
    summary = code_agent.get_context_summary()
    print(f"\n📊 Resumen del contexto:")
    print(f"  Mensajes: {summary['total_messages']}")
    print(f"  Tokens: {summary['total_tokens']}/{summary['max_tokens']}")
    print(f"  Uso: {summary['usage_percentage']:.1f}%\n")


def example_parallel_agents():
    """Ejemplo: Ejecutar múltiples agentes en paralelo (simulado)"""
    print("\n" + "="*60)
    print("EJEMPLO AVANZADO 3: Múltiples Agentes")
    print("="*60 + "\n")

    # Crear múltiples agentes
    code_agent = CodeAgent(model="deepseek-chat")
    research_agent = ResearchAgent(model="claude-sonnet-4-5-20250929")

    # Tarea para cada agente
    print("🔄 Ejecutando tareas en paralelo (simulado)...\n")

    # Agente de código
    print("Code Agent trabajando...")
    code_result = code_agent.chat("Busca todos los archivos .py en el proyecto")

    # Agente de investigación
    print("Research Agent trabajando...")
    research_result = research_agent.chat("Analiza la estructura del proyecto")

    print("\n📊 Resultados:")
    print(f"\n[CODE AGENT]\n{code_result}\n")
    print(f"\n[RESEARCH AGENT]\n{research_result}\n")


def example_workflow():
    """Ejemplo: Workflow complejo con múltiples pasos"""
    print("\n" + "="*60)
    print("EJEMPLO AVANZADO 4: Workflow Complejo")
    print("="*60 + "\n")

    orchestrator = Orchestrator()
    orchestrator.register_agent("code", CodeAgent(model="deepseek-chat"))
    orchestrator.register_agent("research", ResearchAgent())

    # Workflow: Analizar -> Documentar -> Refactorizar
    workflow_steps = [
        {
            "step": 1,
            "task": "Analiza la estructura del proyecto multi_agent_system",
            "description": "Investigación inicial"
        },
        {
            "step": 2,
            "task": "Basándote en el análisis anterior, identifica los archivos principales",
            "description": "Identificación"
        },
        {
            "step": 3,
            "task": "Genera un resumen de 3 puntos sobre el sistema",
            "description": "Síntesis"
        }
    ]

    results = []
    for step_info in workflow_steps:
        print(f"\n📌 PASO {step_info['step']}: {step_info['description']}")
        print(f"   Tarea: {step_info['task']}\n")

        result = orchestrator.chat(step_info['task'])
        results.append(result)

        print(f"   Resultado: {result[:200]}...\n")

    print("\n✅ Workflow completado\n")


def example_tool_chaining():
    """Ejemplo: Encadenamiento de herramientas"""
    print("\n" + "="*60)
    print("EJEMPLO AVANZADO 5: Encadenamiento de Herramientas")
    print("="*60 + "\n")

    code_agent = CodeAgent()

    # Tarea que requiere múltiples herramientas
    response = code_agent.chat(
        "Busca todos los archivos Python, "
        "lee el primero que encuentres, "
        "y cuéntame qué hace"
    )

    print(f"\nRespuesta: {response}\n")


def example_error_handling():
    """Ejemplo: Manejo de errores"""
    print("\n" + "="*60)
    print("EJEMPLO AVANZADO 6: Manejo de Errores")
    print("="*60 + "\n")

    code_agent = CodeAgent()

    # Intentar leer archivo que no existe
    response = code_agent.chat("Lee el archivo /path/que/no/existe.txt")
    print(f"Respuesta con error: {response}\n")

    # El agente debería manejar el error gracefully


def example_model_comparison():
    """Ejemplo: Comparar diferentes modelos en la misma tarea"""
    print("\n" + "="*60)
    print("EJEMPLO AVANZADO 7: Comparación de Modelos")
    print("="*60 + "\n")

    # Misma tarea con diferentes modelos
    task = "Explica qué es un agente de IA en 2 oraciones"

    models = [
        "claude-sonnet-4-5-20250929",
        "gpt-4o",
        "deepseek-chat"
    ]

    print(f"📝 Tarea: {task}\n")

    for model in models:
        print(f"\n🤖 Modelo: {model}")
        try:
            agent = CodeAgent(model=model)
            response = agent.chat(task)
            print(f"Respuesta: {response}\n")
        except Exception as e:
            print(f"Error con {model}: {e}\n")


if __name__ == "__main__":
    print("\n🚀 Multi-Agent System - Ejemplos Avanzados\n")

    # Ejecutar ejemplos (comenta los que no quieras)
    example_custom_agent()
    # example_context_management()
    # example_parallel_agents()
    # example_workflow()
    # example_tool_chaining()
    # example_error_handling()
    # example_model_comparison()

    print("\n✅ Ejemplos avanzados completados\n")
