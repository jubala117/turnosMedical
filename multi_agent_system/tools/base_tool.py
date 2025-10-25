"""
Clase base para herramientas (tools)
"""
from typing import Dict, Any, Callable, Optional
from abc import ABC, abstractmethod


class BaseTool(ABC):
    """Clase base para todas las herramientas"""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    def execute(self, **kwargs) -> Any:
        """
        Ejecuta la herramienta con los parámetros dados.

        Returns:
            Resultado de la ejecución
        """
        pass

    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """
        Retorna el schema de la herramienta en formato compatible con LLMs.

        Returns:
            Schema en formato de tool calling
        """
        pass

    def to_anthropic_format(self) -> Dict[str, Any]:
        """Convierte la herramienta a formato Anthropic"""
        schema = self.get_schema()
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": schema
        }

    def to_openai_format(self) -> Dict[str, Any]:
        """Convierte la herramienta a formato OpenAI"""
        schema = self.get_schema()
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": schema
            }
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Retorna representación en dict con todos los campos"""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.get_schema()
        }


class ToolRegistry:
    """Registro centralizado de herramientas"""

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}

    def register(self, tool: BaseTool):
        """Registra una herramienta"""
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[BaseTool]:
        """Obtiene una herramienta por nombre"""
        return self._tools.get(name)

    def get_all(self) -> Dict[str, BaseTool]:
        """Obtiene todas las herramientas"""
        return self._tools

    def get_schemas(self, format: str = "anthropic") -> list:
        """
        Obtiene los schemas de todas las herramientas.

        Args:
            format: "anthropic" o "openai"

        Returns:
            Lista de schemas
        """
        schemas = []
        for tool in self._tools.values():
            if format == "anthropic":
                schemas.append(tool.to_anthropic_format())
            elif format == "openai":
                schemas.append(tool.to_openai_format())
        return schemas

    def execute(self, name: str, **kwargs) -> Any:
        """Ejecuta una herramienta por nombre"""
        tool = self.get(name)
        if not tool:
            raise ValueError(f"Tool '{name}' no encontrada")
        return tool.execute(**kwargs)


# Registro global de herramientas
global_tool_registry = ToolRegistry()
