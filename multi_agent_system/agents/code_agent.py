"""
Agente especializado en tareas de código
"""
from typing import List
from ..core.base_agent import BaseAgent
from ..tools.file_tools import ReadFileTool, WriteFileTool, EditFileTool
from ..tools.search_tools import GrepTool, GlobTool
from ..tools.bash_tool import BashTool


class CodeAgent(BaseAgent):
    """
    Agente especializado en tareas de código.

    Capacidades:
    - Leer, escribir y editar archivos
    - Buscar código (grep, glob)
    - Ejecutar comandos (bash)
    - Analizar y modificar código
    """

    def __init__(self, model: str = "deepseek-chat", **kwargs):
        system_message = """Eres un agente especializado en tareas de programación.

Tus capacidades incluyen:
- Leer, escribir y editar archivos de código
- Buscar patrones en código (grep, glob)
- Ejecutar comandos bash
- Analizar estructuras de código
- Refactorizar y optimizar código

Cuando te pidan realizar una tarea:
1. Analiza qué herramientas necesitas
2. Usa las herramientas apropiadas
3. Verifica tus cambios
4. Proporciona una respuesta clara y concisa

Siempre sé preciso y cuidadoso con las modificaciones de código."""

        # Herramientas disponibles
        tools = [
            ReadFileTool(),
            WriteFileTool(),
            EditFileTool(),
            GrepTool(),
            GlobTool(),
            BashTool()
        ]

        super().__init__(
            name="CodeAgent",
            model=model,
            system_message=system_message,
            tools=tools,
            temperature=kwargs.get("temperature", 0.3),  # Más determinista para código
            max_tokens=kwargs.get("max_tokens", 8192)
        )

    def get_capabilities(self) -> List[str]:
        return [
            "Leer archivos",
            "Escribir archivos",
            "Editar archivos",
            "Buscar código (grep)",
            "Buscar archivos (glob)",
            "Ejecutar comandos bash",
            "Analizar código",
            "Refactorizar código"
        ]

    def read_file(self, file_path: str) -> str:
        """Atajo para leer un archivo"""
        return self.chat(f"Lee el archivo: {file_path}")

    def write_file(self, file_path: str, content: str) -> str:
        """Atajo para escribir un archivo"""
        return self.chat(f"Escribe el siguiente contenido en {file_path}:\n\n{content}")

    def search_code(self, pattern: str, file_pattern: str = "*.py") -> str:
        """Atajo para buscar código"""
        return self.chat(f"Busca el patrón '{pattern}' en archivos {file_pattern}")
