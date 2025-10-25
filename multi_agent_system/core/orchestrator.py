"""
Agente Orquestador Principal

Similar a Claude Code, este agente coordina a todos los demás agentes
y decide cuándo delegar tareas a agentes especializados.
"""
from typing import List, Dict, Any, Optional
from .base_agent import BaseAgent
from ..tools.base_tool import BaseTool
from ..tools.file_tools import ReadFileTool, WriteFileTool, EditFileTool, ListDirectoryTool
from ..tools.search_tools import GrepTool, GlobTool
from ..tools.bash_tool import BashTool


class DelegateToAgentTool(BaseTool):
    """
    Herramienta especial que permite al orquestador delegar tareas a otros agentes.

    Esto es similar a cómo yo uso el Task tool para lanzar agentes especializados.
    """

    def __init__(self, orchestrator):
        super().__init__(
            name="delegate_to_agent",
            description="Delega una tarea compleja a un agente especializado (code o research)"
        )
        self.orchestrator = orchestrator

    def execute(self, agent_type: str, task: str, **kwargs) -> str:
        """
        Ejecuta una tarea con un agente especializado.

        Args:
            agent_type: Tipo de agente ("code", "research", "database")
            task: Descripción de la tarea
            **kwargs: Parámetros adicionales (ignorados, para compatibilidad)

        Returns:
            Resultado de la tarea
        """
        agent = self.orchestrator.get_agent(agent_type)
        if not agent:
            return f"Error: Agente '{agent_type}' no disponible"

        print(f"\n🤖 Delegando a {agent.name}: {task}\n")
        response = agent.chat(task)
        print(f"\n✅ {agent.name} completó la tarea\n")

        return response

    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "agent_type": {
                    "type": "string",
                    "enum": ["code", "research"],
                    "description": "Tipo de agente: 'code' para código, 'research' para análisis"
                },
                "task": {
                    "type": "string",
                    "description": "Descripción detallada de la tarea a realizar"
                }
            },
            "required": ["agent_type", "task"]
        }


class Orchestrator(BaseAgent):
    """
    Agente Orquestador Principal.

    Similar a cómo funciono yo (Claude Code), este agente:
    - Interactúa directamente con el usuario
    - Tiene acceso a herramientas básicas
    - Puede delegar tareas complejas a agentes especializados
    - Coordina el trabajo de múltiples agentes
    - Sintetiza resultados
    """

    def __init__(
        self,
        model: str = "claude-sonnet-4-5-20250929",
        specialized_agents: Optional[Dict[str, BaseAgent]] = None,
        **kwargs
    ):
        system_message = """Eres el Agente Orquestador Principal de un sistema multi-agente.

Tu rol es similar al de Claude Code:
- Interactúas directamente con el usuario
- Analizas tareas y decides cómo resolverlas
- Delegas tareas complejas a agentes especializados cuando sea necesario
- Coordinas el trabajo de múltiples agentes
- Sintetizas resultados y comunicas al usuario

Agentes especializados disponibles:
- CodeAgent: Para tareas de código (leer, escribir, editar, buscar)
- ResearchAgent: Para investigación y análisis de proyectos
- DatabaseAgent: Para operaciones con bases de datos

Herramientas directas disponibles:
- Operaciones de archivos (read_file, write_file, edit_file, list_directory)
- Búsqueda (grep, glob)
- Comandos bash

Cuándo delegar a agentes especializados:
1. Tareas complejas que requieren múltiples pasos
2. Análisis profundo de código
3. Investigación exhaustiva
4. Operaciones especializadas (DB, web, etc.)

Cuándo usar herramientas directamente:
1. Operaciones simples de archivos
2. Búsquedas rápidas
3. Comandos bash simples

Siempre sé eficiente: usa herramientas directas para tareas simples,
delega a agentes para tareas complejas."""

        # Herramientas directas del orquestador
        base_tools = [
            ReadFileTool(),
            WriteFileTool(),
            EditFileTool(),
            ListDirectoryTool(),
            GrepTool(),
            GlobTool(),
            BashTool()
        ]

        super().__init__(
            name="Orchestrator",
            model=model,
            system_message=system_message,
            tools=base_tools,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 4096)
        )

        # Agentes especializados
        self.specialized_agents = specialized_agents or {}

        # Agregar herramienta de delegación
        delegate_tool = DelegateToAgentTool(self)
        self.tools.append(delegate_tool)
        self.tool_registry.register(delegate_tool)

    def register_agent(self, agent_type: str, agent: BaseAgent):
        """Registra un agente especializado"""
        self.specialized_agents[agent_type] = agent
        print(f"✅ Agente '{agent_type}' registrado: {agent.name}")

    def get_agent(self, agent_type: str) -> Optional[BaseAgent]:
        """Obtiene un agente especializado"""
        return self.specialized_agents.get(agent_type)

    def get_capabilities(self) -> List[str]:
        capabilities = [
            "Interacción con usuario",
            "Coordinación de agentes",
            "Operaciones de archivos",
            "Búsqueda de código",
            "Ejecución de comandos"
        ]

        # Agregar capacidades de agentes especializados
        for agent_type, agent in self.specialized_agents.items():
            agent_caps = agent.get_capabilities()
            capabilities.append(f"\n[{agent_type.upper()}] {', '.join(agent_caps)}")

        return capabilities

    def run(self, user_message: str, **kwargs) -> Dict[str, Any]:
        """
        Ejecuta el orquestador con un mensaje del usuario.

        Override del método base para agregar logging y coordinación.
        """
        print(f"\n{'='*60}")
        print(f"📝 Usuario: {user_message}")
        print(f"{'='*60}\n")

        response = super().run(user_message, **kwargs)

        print(f"\n{'='*60}")
        print(f"🤖 Orquestador: {response['content'][:200]}...")
        print(f"{'='*60}\n")

        return response

    def show_status(self):
        """Muestra el estado del sistema"""
        print("\n" + "="*60)
        print("📊 ESTADO DEL SISTEMA")
        print("="*60)

        # Estado del orquestador
        print(f"\n🎯 Orquestador Principal:")
        print(f"  Modelo: {self.model}")
        print(f"  Contexto: {self.context}")

        # Agentes registrados
        print(f"\n🤖 Agentes Especializados ({len(self.specialized_agents)}):")
        for agent_type, agent in self.specialized_agents.items():
            print(f"  [{agent_type}] {agent.name}")
            print(f"    - Modelo: {agent.model}")
            print(f"    - Herramientas: {len(agent.tools)}")
            print(f"    - Contexto: {agent.context}")

        print("\n" + "="*60 + "\n")

    def __repr__(self) -> str:
        return (
            f"Orchestrator("
            f"model='{self.model}', "
            f"agents={len(self.specialized_agents)}, "
            f"tools={len(self.tools)}, "
            f"context={self.context}"
            f")"
        )
