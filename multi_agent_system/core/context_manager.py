"""
Gestión de contexto para agentes
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Message:
    """Representa un mensaje en la conversación"""
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)
    tokens: int = 0  # Estimación de tokens

    def to_dict(self) -> Dict[str, str]:
        """Convierte el mensaje a formato dict para APIs"""
        return {"role": self.role, "content": self.content}


class ContextManager:
    """
    Gestiona el contexto de la conversación.

    Similar a cómo funciono yo, mantiene:
    - Historial de mensajes
    - Límite de tokens
    - Estrategias de optimización cuando se llena el contexto
    """

    def __init__(self, max_tokens: int = 100000):
        self.max_tokens = max_tokens
        self.messages: List[Message] = []
        self.total_tokens = 0
        self.system_message: Optional[str] = None

    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None) -> Message:
        """
        Agrega un mensaje al contexto.

        Args:
            role: "user", "assistant", o "system"
            content: Contenido del mensaje
            metadata: Metadata adicional

        Returns:
            El mensaje creado
        """
        # Estimar tokens (aprox 1 token = 4 caracteres)
        estimated_tokens = len(content) // 4

        message = Message(
            role=role,
            content=content,
            metadata=metadata or {},
            tokens=estimated_tokens
        )

        self.messages.append(message)
        self.total_tokens += estimated_tokens

        # Verificar si necesitamos optimizar
        if self.total_tokens > self.max_tokens * 0.8:  # 80% del límite
            self._optimize_context()

        return message

    def set_system_message(self, content: str):
        """Establece el mensaje del sistema"""
        self.system_message = content

    def get_messages(self, include_system: bool = True) -> List[Dict[str, str]]:
        """
        Obtiene los mensajes en formato para enviar a la API.

        Args:
            include_system: Incluir mensaje del sistema

        Returns:
            Lista de mensajes en formato dict
        """
        messages = []

        if include_system and self.system_message:
            messages.append({"role": "system", "content": self.system_message})

        messages.extend([msg.to_dict() for msg in self.messages])
        return messages

    def get_recent_messages(self, count: int = 10) -> List[Message]:
        """Obtiene los últimos N mensajes"""
        return self.messages[-count:]

    def clear(self):
        """Limpia el contexto"""
        self.messages = []
        self.total_tokens = 0

    def _optimize_context(self):
        """
        Optimiza el contexto cuando se está llenando.

        Estrategias:
        1. Eliminar mensajes antiguos (mantener los más recientes)
        2. Resumir partes de la conversación (TODO: implementar)
        """
        # Por ahora, simplemente mantenemos los últimos N mensajes
        if len(self.messages) > 50:
            # Mantener los últimos 30 mensajes
            removed_messages = self.messages[:-30]
            self.messages = self.messages[-30:]

            # Recalcular tokens
            self.total_tokens = sum(msg.tokens for msg in self.messages)

            print(f"⚠️ Contexto optimizado: {len(removed_messages)} mensajes antiguos removidos")

    def get_summary(self) -> Dict[str, Any]:
        """Obtiene un resumen del contexto actual"""
        return {
            "total_messages": len(self.messages),
            "total_tokens": self.total_tokens,
            "max_tokens": self.max_tokens,
            "usage_percentage": (self.total_tokens / self.max_tokens) * 100,
            "has_system_message": self.system_message is not None
        }

    def __repr__(self) -> str:
        summary = self.get_summary()
        return (
            f"ContextManager("
            f"messages={summary['total_messages']}, "
            f"tokens={summary['total_tokens']}/{summary['max_tokens']} "
            f"({summary['usage_percentage']:.1f}%)"
            f")"
        )


class ConversationHistory:
    """
    Almacena el historial completo de conversaciones (persistente).
    Útil para mantener contexto entre sesiones.
    """

    def __init__(self):
        self.conversations: List[Dict[str, Any]] = []

    def save_conversation(self, context: ContextManager, name: str = None):
        """Guarda una conversación"""
        conversation = {
            "name": name or f"conversation_{datetime.now().isoformat()}",
            "timestamp": datetime.now().isoformat(),
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "metadata": msg.metadata
                }
                for msg in context.messages
            ],
            "summary": context.get_summary()
        }
        self.conversations.append(conversation)

    def load_conversation(self, index: int) -> ContextManager:
        """Carga una conversación guardada"""
        if index >= len(self.conversations):
            raise ValueError(f"Conversación {index} no existe")

        conversation = self.conversations[index]
        context = ContextManager()

        for msg_data in conversation["messages"]:
            context.add_message(
                role=msg_data["role"],
                content=msg_data["content"],
                metadata=msg_data.get("metadata", {})
            )

        return context

    def list_conversations(self) -> List[Dict[str, Any]]:
        """Lista todas las conversaciones guardadas"""
        return [
            {
                "index": i,
                "name": conv["name"],
                "timestamp": conv["timestamp"],
                "message_count": len(conv["messages"])
            }
            for i, conv in enumerate(self.conversations)
        ]
