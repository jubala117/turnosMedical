#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Multi-Agent System - Quick Start Simple
Version simplificada que funciona
"""
import os
import sys

# Fix de encoding para Windows
if sys.platform == 'win32':
    try:
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except:
        pass

# Fix para imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from multi_agent_system.core.orchestrator import Orchestrator
from multi_agent_system.agents.code_agent import CodeAgent
from multi_agent_system.agents.research_agent import ResearchAgent
from multi_agent_system.config.settings import Settings


def main():
    print("\n" + "="*60)
    print("  Multi-Agent System - Modo Simple")
    print("="*60 + "\n")

    # Verificar API keys
    print("Verificando API keys...")

    has_claude = bool(Settings.ANTHROPIC_API_KEY)
    has_openai = bool(Settings.OPENAI_API_KEY)
    has_deepseek = bool(Settings.DEEPSEEK_API_KEY)

    if has_claude:
        print("  [OK] Claude")
    if has_openai:
        print("  [OK] OpenAI")
    if has_deepseek:
        print("  [OK] DeepSeek")

    if not (has_claude or has_openai):
        print("\nERROR: Necesitas al menos Claude o OpenAI configurado en .env")
        return

    print("\nInicializando sistema...")

    # Decidir qué modelo usar
    if has_claude:
        main_model = "claude-sonnet-4-5-20250929"
        print("  Usando: Claude")
    elif has_openai:
        main_model = "gpt-4o"
        print("  Usando: GPT-4")

    code_model = "deepseek-chat" if has_deepseek else main_model

    # Crear sistema
    try:
        orchestrator = Orchestrator(model=main_model)

        code_agent = CodeAgent(model=code_model)
        orchestrator.register_agent("code", code_agent)

        research_agent = ResearchAgent(model=main_model)
        orchestrator.register_agent("research", research_agent)

        print("\nSistema listo!\n")
        print("="*60)

        # Loop interactivo
        while True:
            try:
                user_input = input("\nTu: ").strip()

                if not user_input:
                    continue

                if user_input.lower() in ['/quit', '/exit', 'salir']:
                    print("\nHasta luego!\n")
                    break

                if user_input.lower() == '/status':
                    orchestrator.show_status()
                    continue

                # Procesar mensaje
                response = orchestrator.chat(user_input)
                print(f"\nAsistente: {response}")

            except KeyboardInterrupt:
                print("\n\nHasta luego!\n")
                break
            except Exception as e:
                print(f"\nError: {e}")
                print("Intenta de nuevo o escribe /quit para salir\n")

    except Exception as e:
        print(f"\nError al inicializar el sistema: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
