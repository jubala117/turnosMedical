"""
Clase base para todos los agentes
"""
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from .api_client import MultiAPIClient
from .context_manager import ContextManager
from ..tools.base_tool import BaseTool, ToolRegistry
from ..config.settings import Settings


class BaseAgent(ABC):
    """
    Clase base para todos los agentes del sistema.

    Similar a cómo funciono yo, cada agente tiene:
    - Un modelo LLM asignado
    - Herramientas disponibles
    - Contexto propio
    - Sistema de mensajes
    """

    def __init__(
        self,
        name: str,
        model: str,
        system_message: str,
        tools: Optional[List[BaseTool]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ):
        """
        Inicializa un agente.

        Args:
            name: Nombre del agente
            model: Nombre del modelo a usar (ej: "claude-sonnet-4-5-20250929")
            system_message: Instrucciones del sistema para el agente
            tools: Lista de herramientas disponibles
            temperature: Temperatura del modelo
            max_tokens: Máximo de tokens a generar
        """
        self.name = name
        self.model = model
        self.system_message = system_message
        self.temperature = temperature
        self.max_tokens = max_tokens

        # Configurar herramientas
        self.tools = tools or []
        self.tool_registry = ToolRegistry()
        for tool in self.tools:
            self.tool_registry.register(tool)

        # Contexto del agente
        self.context = ContextManager(max_tokens=Settings.get_context_limit(model))
        self.context.set_system_message(system_message)

        # Inicializar cliente API
        model_config = Settings.get_model_config(model)
        if not model_config:
            raise ValueError(f"Modelo '{model}' no configurado")

        self.api_client = MultiAPIClient(
            provider=model_config["provider"],
            model=model,
            api_key=model_config["api_key"],
            base_url=model_config.get("base_url")
        )

    def run(self, user_message: str, **kwargs) -> Dict[str, Any]:
        """
        Ejecuta el agente con un mensaje del usuario.

        Args:
            user_message: Mensaje del usuario
            **kwargs: Argumentos adicionales

        Returns:
            Respuesta del agente
        """
        # Agregar mensaje del usuario al contexto
        self.context.add_message("user", user_message)

        # Obtener respuesta del modelo
        response = self._get_model_response(**kwargs)

        # Procesar tool calls si existen
        while response.get("tool_calls"):
            response = self._handle_tool_calls(response)

        # Agregar respuesta al contexto
        self.context.add_message("assistant", response["content"])

        return response

    def _get_model_response(self, **kwargs) -> Dict[str, Any]:
        """Obtiene respuesta del modelo"""
        messages = self.context.get_messages(include_system=True)

        # Obtener schemas de herramientas
        tool_schemas = None
        if self.tools:
            provider = self.api_client.provider
            format_type = "anthropic" if provider == "anthropic" else "openai"
            tool_schemas = self.tool_registry.get_schemas(format=format_type)

        # Llamar a la API
        response = self.api_client.chat(
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            tools=tool_schemas,
            **kwargs
        )

        return response

    def _handle_tool_calls(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maneja las llamadas a herramientas.

        Similar a cómo yo ejecuto herramientas y proceso los resultados.
        """
        tool_calls = response.get("tool_calls", [])

        if not tool_calls:
            return response

        # Ejecutar cada herramienta
        tool_results = []
        for tool_call in tool_calls:
            # Validar que tool_call tenga los campos necesarios
            if not isinstance(tool_call, dict):
                print(f"⚠️ Warning: tool_call no es un dict: {tool_call}")
                continue
            
            tool_name = tool_call.get("name")
            tool_args = tool_call.get("arguments", {})
            tool_id = tool_call.get("id", "unknown")

            if not tool_name:
                print(f"⚠️ Warning: tool_call sin 'name': {tool_call}")
                continue

            try:
                result = self.tool_registry.execute(tool_name, **tool_args)
                tool_results.append({
                    "tool_call_id": tool_id,
                    "tool_name": tool_name,
                    "result": str(result)
                })
            except Exception as e:
                tool_results.append({
                    "tool_call_id": tool_id,
                    "tool_name": tool_name,
                    "result": f"Error: {str(e)}"
                })

        # Agregar resultados al contexto
        results_text = "\n\n".join([
            f"Tool: {tr['tool_name']}\nResult: {tr['result']}"
            for tr in tool_results
        ])

        self.context.add_message("user", f"Tool results:\n{results_text}")

        # Obtener nueva respuesta del modelo con los resultados
        return self._get_model_response()

    def chat(self, message: str) -> str:
        """
        Interfaz simple de chat.

        Args:
            message: Mensaje del usuario

        Returns:
            Respuesta del agente (solo texto)
        """
        response = self.run(message)
        return response.get("content", "")

    def get_context_summary(self) -> Dict[str, Any]:
        """Obtiene resumen del contexto"""
        return self.context.get_summary()

    def clear_context(self):
        """Limpia el contexto del agente"""
        self.context.clear()
        self.context.set_system_message(self.system_message)

    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """
        Retorna las capacidades del agente.

        Debe ser implementado por cada agente especializado.
        """
        pass

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"name='{self.name}', "
            f"model='{self.model}', "
            f"tools={len(self.tools)}, "
            f"context={self.context}"
            f")"
        )
