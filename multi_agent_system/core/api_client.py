"""
Cliente Multi-API que soporta Claude, OpenAI, DeepSeek, Gemini
"""
import json
from typing import List, Dict, Any, Optional

# Imports opcionales - solo importar si están disponibles
try:
    from anthropic import Anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

try:
    import google.generativeai as genai
    HAS_GOOGLE = True
except ImportError:
    HAS_GOOGLE = False


class Message:
    """Clase para representar mensajes"""
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

    def to_dict(self):
        return {"role": self.role, "content": self.content}


class MultiAPIClient:
    """Cliente unificado para múltiples APIs de LLMs"""

    def __init__(self, provider: str, model: str, api_key: str, base_url: Optional[str] = None):
        self.provider = provider
        self.model = model
        self.api_key = api_key
        self.base_url = base_url

        # Inicializar el cliente apropiado
        if provider == "anthropic":
            if not HAS_ANTHROPIC:
                raise ImportError("anthropic package not installed. Run: pip install anthropic")
            self.client = Anthropic(api_key=api_key)
        elif provider == "openai" or provider == "deepseek":
            if not HAS_OPENAI:
                raise ImportError("openai package not installed. Run: pip install openai")
            # DeepSeek usa API compatible con OpenAI
            self.client = OpenAI(api_key=api_key, base_url=base_url)
        elif provider == "google":
            if not HAS_GOOGLE:
                raise ImportError("google-generativeai package not installed. Run: pip install google-generativeai")
            genai.configure(api_key=api_key)
            self.client = genai.GenerativeModel(model)
        else:
            raise ValueError(f"Provider no soportado: {provider}")

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: Optional[List[Dict]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Realiza una llamada de chat al modelo.

        Args:
            messages: Lista de mensajes [{"role": "user", "content": "..."}]
            temperature: Temperatura del modelo
            max_tokens: Máximo de tokens a generar
            tools: Lista de tools disponibles para el modelo
            **kwargs: Argumentos adicionales

        Returns:
            Respuesta del modelo normalizada
        """
        if self.provider == "anthropic":
            return self._chat_anthropic(messages, temperature, max_tokens, tools, **kwargs)
        elif self.provider == "openai" or self.provider == "deepseek":
            return self._chat_openai(messages, temperature, max_tokens, tools, **kwargs)
        elif self.provider == "google":
            return self._chat_google(messages, temperature, max_tokens, **kwargs)
        else:
            raise ValueError(f"Provider no soportado: {self.provider}")

    def _chat_anthropic(self, messages, temperature, max_tokens, tools, **kwargs):
        """Llamada a Claude (Anthropic)"""
        # Separar system message si existe
        system_message = ""
        chat_messages = []

        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                chat_messages.append(msg)

        # Preparar tools si existen
        anthropic_tools = None
        if tools:
            anthropic_tools = self._convert_tools_to_anthropic(tools)

        # Hacer la llamada
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_message if system_message else None,
            messages=chat_messages,
            tools=anthropic_tools if anthropic_tools else [],
            **kwargs
        )

        # Normalizar respuesta
        return self._normalize_anthropic_response(response)

    def _chat_openai(self, messages, temperature, max_tokens, tools, **kwargs):
        """Llamada a OpenAI/DeepSeek"""
        # Preparar tools si existen
        openai_tools = None
        if tools:
            openai_tools = self._convert_tools_to_openai(tools)

        # Hacer la llamada
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            tools=openai_tools if openai_tools else None,
            **kwargs
        )

        # Normalizar respuesta
        return self._normalize_openai_response(response)

    def _chat_google(self, messages, temperature, max_tokens, **kwargs):
        """Llamada a Google Gemini"""
        # Gemini usa un formato diferente
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])

        response = self.client.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens
            )
        )

        # Normalizar respuesta
        return {
            "content": response.text,
            "role": "assistant",
            "model": self.model,
            "provider": self.provider,
            "tool_calls": None,
            "finish_reason": "stop"
        }

    def _normalize_anthropic_response(self, response) -> Dict[str, Any]:
        """Normaliza la respuesta de Anthropic"""
        content = ""
        tool_calls = []

        for block in response.content:
            if block.type == "text":
                content += block.text
            elif block.type == "tool_use":
                tool_calls.append({
                    "id": block.id,
                    "name": block.name,
                    "arguments": block.input
                })

        return {
            "content": content,
            "role": "assistant",
            "model": self.model,
            "provider": self.provider,
            "tool_calls": tool_calls if tool_calls else None,
            "finish_reason": response.stop_reason,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            }
        }

    def _normalize_openai_response(self, response) -> Dict[str, Any]:
        """Normaliza la respuesta de OpenAI/DeepSeek"""
        message = response.choices[0].message
        content = message.content or ""
        tool_calls = None

        if message.tool_calls:
            tool_calls = [
                {
                    "id": tc.id,
                    "name": tc.function.name,
                    "arguments": json.loads(tc.function.arguments)
                }
                for tc in message.tool_calls
            ]

        return {
            "content": content,
            "role": "assistant",
            "model": self.model,
            "provider": self.provider,
            "tool_calls": tool_calls,
            "finish_reason": response.choices[0].finish_reason,
            "usage": {
                "input_tokens": response.usage.prompt_tokens,
                "output_tokens": response.usage.completion_tokens
            }
        }

    def _convert_tools_to_anthropic(self, tools: List[Dict]) -> List[Dict]:
        """Convierte tools a formato Anthropic"""
        return tools  # Ya deberían estar en formato compatible

    def _convert_tools_to_openai(self, tools: List[Dict]) -> List[Dict]:
        """Convierte tools a formato OpenAI"""
        openai_tools = []
        for tool in tools:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool.get("description", ""),
                    "parameters": tool.get("input_schema", {})
                }
            })
        return openai_tools

    def stream_chat(self, messages: List[Dict[str, str]], **kwargs):
        """Streaming de respuestas (para implementar)"""
        # TODO: Implementar streaming para cada provider
        raise NotImplementedError("Streaming aún no implementado")
