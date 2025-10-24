"""
Multi-Agent System

Sistema de agentes multi-modelo que soporta Claude, OpenAI, DeepSeek, Gemini y más.
"""

__version__ = "1.0.0"
__author__ = "Created with Claude Code"

# Importaciones principales para facilitar el uso
from .core.orchestrator import Orchestrator
from .core.base_agent import BaseAgent
from .agents.code_agent import CodeAgent
from .agents.research_agent import ResearchAgent
from .config.settings import Settings

__all__ = [
    "Orchestrator",
    "BaseAgent",
    "CodeAgent",
    "ResearchAgent",
    "Settings"
]
