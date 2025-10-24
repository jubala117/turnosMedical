"""
Configuración del Multi-Agent System
"""
import os
from dotenv import load_dotenv
from typing import Dict, Any

load_dotenv()

class Settings:
    """Configuración centralizada del sistema"""

    # API Keys
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

    # Configuración de modelos
    MODELS = {
        "claude": {
            "provider": "anthropic",
            "base_url": "https://api.anthropic.com/v1",
            "models": {
                "sonnet": "claude-sonnet-4-5-20250929",
                "opus": "claude-opus-4-20250514",
                "haiku": "claude-3-5-haiku-20241022"
            },
            "default": "sonnet"
        },
        "openai": {
            "provider": "openai",
            "base_url": "https://api.openai.com/v1",
            "models": {
                "gpt4": "gpt-4-turbo-preview",
                "gpt4o": "gpt-4o",
                "gpt35": "gpt-3.5-turbo"
            },
            "default": "gpt4o"
        },
        "deepseek": {
            "provider": "openai",  # Compatible con OpenAI API
            "base_url": "https://api.deepseek.com",
            "models": {
                "chat": "deepseek-chat",
                "coder": "deepseek-coder"
            },
            "default": "chat"
        },
        "gemini": {
            "provider": "google",
            "base_url": "https://generativelanguage.googleapis.com/v1",
            "models": {
                "pro": "gemini-pro",
                "flash": "gemini-1.5-flash"
            },
            "default": "flash"
        }
    }

    # Límites de contexto (tokens)
    CONTEXT_LIMITS = {
        "claude-sonnet-4-5-20250929": 200000,
        "claude-opus-4-20250514": 200000,
        "gpt-4o": 128000,
        "deepseek-chat": 64000,
        "gemini-pro": 30000
    }

    # Configuración de agentes
    AGENT_CONFIG = {
        "orchestrator": {
            "model_preference": ["claude", "gpt4o"],  # Preferencia de modelos
            "temperature": 0.7,
            "max_tokens": 4096
        },
        "code_agent": {
            "model_preference": ["deepseek", "claude"],
            "temperature": 0.3,
            "max_tokens": 8192
        },
        "research_agent": {
            "model_preference": ["claude", "gpt4o"],
            "temperature": 0.5,
            "max_tokens": 4096
        },
        "database_agent": {
            "model_preference": ["deepseek", "gpt35"],
            "temperature": 0.2,
            "max_tokens": 2048
        }
    }

    # Sistema de logging
    LOGGING = {
        "level": "INFO",
        "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        "save_to_file": True,
        "file_path": "multi_agent_system/logs/system.log"
    }

    @classmethod
    def get_api_key(cls, provider: str) -> str:
        """Obtiene la API key para un proveedor"""
        keys = {
            "anthropic": cls.ANTHROPIC_API_KEY,
            "openai": cls.OPENAI_API_KEY,
            "deepseek": cls.DEEPSEEK_API_KEY,
            "google": cls.GOOGLE_API_KEY
        }
        return keys.get(provider, "")

    @classmethod
    def get_model_config(cls, model_name: str) -> Dict[str, Any]:
        """Obtiene la configuración de un modelo"""
        for provider, config in cls.MODELS.items():
            if model_name in config["models"].values():
                return {
                    "provider": config["provider"],
                    "base_url": config["base_url"],
                    "model": model_name,
                    "api_key": cls.get_api_key(config["provider"])
                }
        return {}

    @classmethod
    def get_context_limit(cls, model: str) -> int:
        """Obtiene el límite de contexto de un modelo"""
        return cls.CONTEXT_LIMITS.get(model, 4096)
