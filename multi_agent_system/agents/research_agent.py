"""
Agente especializado en investigación y análisis
"""
from typing import List
from ..core.base_agent import BaseAgent
from ..tools.file_tools import ReadFileTool, ListDirectoryTool
from ..tools.search_tools import GrepTool, GlobTool, FindFileTool


class ResearchAgent(BaseAgent):
    """
    Agente especializado en investigación y análisis de código.

    Capacidades:
    - Explorar estructuras de proyectos
    - Analizar código existente
    - Buscar información específica
    - Generar reportes y documentación
    """

    def __init__(self, model: str = "claude-sonnet-4-5-20250929", **kwargs):
        system_message = """Eres un agente especializado en investigación y análisis de código.

Tus capacidades incluyen:
- Explorar y mapear estructuras de proyectos
- Analizar código y entender arquitecturas
- Buscar información específica en bases de código
- Generar documentación y reportes
- Responder preguntas sobre cómo funciona el código

Cuando investigues:
1. Usa herramientas de búsqueda (grep, glob, find) para explorar
2. Lee archivos relevantes para entender el contexto
3. Analiza patrones y estructuras
4. Proporciona explicaciones claras y detalladas

Sé metódico y exhaustivo en tu análisis."""

        # Herramientas disponibles
        tools = [
            ReadFileTool(),
            ListDirectoryTool(),
            GrepTool(),
            GlobTool(),
            FindFileTool()
        ]

        super().__init__(
            name="ResearchAgent",
            model=model,
            system_message=system_message,
            tools=tools,
            temperature=kwargs.get("temperature", 0.5),
            max_tokens=kwargs.get("max_tokens", 4096)
        )

    def get_capabilities(self) -> List[str]:
        return [
            "Explorar proyectos",
            "Analizar código",
            "Buscar información",
            "Mapear arquitecturas",
            "Generar documentación",
            "Responder preguntas sobre código"
        ]

    def explore_project(self, path: str = ".") -> str:
        """Explora la estructura de un proyecto"""
        return self.chat(f"Explora y describe la estructura del proyecto en: {path}")

    def find_implementation(self, feature: str) -> str:
        """Encuentra cómo está implementada una característica"""
        return self.chat(f"Encuentra y explica cómo está implementado: {feature}")

    def generate_docs(self, path: str) -> str:
        """Genera documentación para un archivo o directorio"""
        return self.chat(f"Genera documentación para: {path}")
