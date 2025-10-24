#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 Multi-Agent System - Quick Start

Script de inicio rápido para empezar a usar el sistema inmediatamente.
"""
import os
import sys
import io

# Fix para encoding en Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Fix para imports - agregar directorio padre al path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Ahora usar imports absolutos
from multi_agent_system.core.orchestrator import Orchestrator
from multi_agent_system.agents.code_agent import CodeAgent
from multi_agent_system.agents.research_agent import ResearchAgent
from multi_agent_system.config.settings import Settings


def check_api_keys():
    """Verifica que las API keys estén configuradas"""
    print("\n🔍 Verificando API keys...\n")

    keys = {
        "Anthropic (Claude)": Settings.ANTHROPIC_API_KEY,
        "OpenAI (GPT)": Settings.OPENAI_API_KEY,
        "DeepSeek": Settings.DEEPSEEK_API_KEY,
        "Google (Gemini)": Settings.GOOGLE_API_KEY
    }

    available = []
    missing = []

    for name, key in keys.items():
        if key:
            available.append(name)
            print(f"✅ {name}")
        else:
            missing.append(name)
            print(f"❌ {name} - No configurada")

    if not available:
        print("\n⚠️ ADVERTENCIA: No hay API keys configuradas!")
        print("   Crea un archivo .env con tus claves:")
        print("   ANTHROPIC_API_KEY=tu_clave")
        print("   OPENAI_API_KEY=tu_clave")
        print("   etc.")
        return False

    print(f"\n✅ {len(available)} API(s) disponible(s)\n")
    return True


def interactive_mode():
    """Modo interactivo con el orquestador"""
    print("\n" + "="*60)
    print("🤖 MODO INTERACTIVO - Multi-Agent System")
    print("="*60)
    print("\nComandos especiales:")
    print("  /help     - Mostrar ayuda")
    print("  /status   - Ver estado del sistema")
    print("  /clear    - Limpiar contexto")
    print("  /quit     - Salir")
    print("\n" + "="*60 + "\n")

    # Crear orquestador con agentes
    print("🔧 Inicializando sistema...\n")

    # ========================================
    # CONFIGURACIÓN DE MODELOS
    # ========================================

    # OPCIÓN 1: Claude (ACTIVA) - Usa Anthropic
    # Claude funciona mejor con el sistema de herramientas
    if Settings.ANTHROPIC_API_KEY:
        orchestrator_model = "claude-sonnet-4-5-20250929"  # Orquestador con Claude
        code_model = "deepseek-chat" if Settings.DEEPSEEK_API_KEY else "claude-sonnet-4-5-20250929"
        research_model = "claude-sonnet-4-5-20250929"
        print(">> Usando Claude como modelo principal")

    # OPCIÓN 2: GPT-4 (COMENTADA) - Usa OpenAI
    # Descomenta estas líneas si prefieres usar GPT-4
    # elif Settings.OPENAI_API_KEY:
    #     orchestrator_model = "gpt-4o"  # Orquestador con GPT-4
    #     code_model = "deepseek-chat" if Settings.DEEPSEEK_API_KEY else "gpt-4o"
    #     research_model = "gpt-4o"
    #     print(">> Usando GPT-4 como modelo principal")

    else:
        print("ERROR: Necesitas al menos una API key configurada")
        print("   Configure ANTHROPIC_API_KEY o OPENAI_API_KEY en el archivo .env")
        return

    orchestrator = Orchestrator(model=orchestrator_model)
    print(f"   Orquestador: {orchestrator_model}")

    # Registrar agentes especializados
    try:
        code_agent = CodeAgent(model=code_model)
        orchestrator.register_agent("code", code_agent)
        print(f"   Code Agent: {code_model}")
    except Exception as e:
        print(f"⚠️ Code Agent no disponible: {e}")

    try:
        research_agent = ResearchAgent(model=research_model)
        orchestrator.register_agent("research", research_agent)
        print(f"   Research Agent: {research_model}")
    except Exception as e:
        print(f"⚠️ Research Agent no disponible: {e}")

    print("✅ Sistema listo!\n")

    # Loop interactivo
    while True:
        try:
            user_input = input("\n💬 Tú: ").strip()

            if not user_input:
                continue

            # Comandos especiales
            if user_input == "/quit":
                print("\n👋 ¡Hasta luego!\n")
                break

            elif user_input == "/help":
                print("\n📖 AYUDA:")
                print("  - Escribe cualquier tarea y el sistema la ejecutará")
                print("  - El orquestador decidirá si delegar a agentes especializados")
                print("  - Ejemplos:")
                print("    • 'Lista los archivos Python en este proyecto'")
                print("    • 'Analiza la estructura del proyecto'")
                print("    • 'Busca la función main y explícala'")
                continue

            elif user_input == "/status":
                orchestrator.show_status()
                continue

            elif user_input == "/clear":
                orchestrator.clear_context()
                print("✅ Contexto limpiado")
                continue

            # Procesar mensaje normal
            response = orchestrator.chat(user_input)
            print(f"\n🤖 Asistente: {response}")

        except KeyboardInterrupt:
            print("\n\n👋 ¡Hasta luego!\n")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}\n")


def demo_mode():
    """Modo demo con ejemplos predefinidos"""
    print("\n" + "="*60)
    print("🎬 MODO DEMO - Ejemplos Predefinidos")
    print("="*60 + "\n")

    # ========================================
    # CONFIGURACIÓN DE MODELOS PARA DEMO
    # ========================================

    # OPCIÓN 1: Claude (ACTIVA)
    if Settings.ANTHROPIC_API_KEY:
        model = "claude-sonnet-4-5-20250929"
        print(">> Demo usando Claude")

    # OPCIÓN 2: GPT-4 (COMENTADA)
    # Descomenta si prefieres usar GPT-4
    # elif Settings.OPENAI_API_KEY:
    #     model = "gpt-4o"
    #     print(">> Demo usando GPT-4")

    else:
        print("ERROR: Necesitas al menos una API key configurada")
        return

    orchestrator = Orchestrator(model=model)

    if Settings.DEEPSEEK_API_KEY or Settings.ANTHROPIC_API_KEY:
        code_agent = CodeAgent()
        orchestrator.register_agent("code", code_agent)

    # Ejemplos
    examples = [
        "Lista los archivos en el directorio actual",
        "Explica qué es un agente de IA en 2 oraciones",
        "¿Cuántos archivos Python hay en este proyecto?"
    ]

    for i, example in enumerate(examples, 1):
        print(f"\n{'='*60}")
        print(f"EJEMPLO {i}: {example}")
        print('='*60)

        try:
            response = orchestrator.chat(example)
            print(f"\n🤖 Respuesta: {response}\n")
        except Exception as e:
            print(f"\n❌ Error: {e}\n")

        if i < len(examples):
            input("\n[Presiona Enter para continuar...]")

    print("\n✅ Demo completada\n")


def main():
    """Función principal"""
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║           🤖 Multi-Agent System                          ║
    ║           Sistema de Agentes Multi-Modelo                 ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    """)

    # Verificar API keys
    if not check_api_keys():
        print("\n⚠️ Continuar sin API keys? (s/n): ", end="")
        if input().lower() != 's':
            return

    print("\nSelecciona un modo:")
    print("  1. Modo Interactivo (recomendado)")
    print("  2. Modo Demo (ejemplos predefinidos)")
    print("  3. Salir")

    choice = input("\nOpción (1-3): ").strip()

    if choice == "1":
        interactive_mode()
    elif choice == "2":
        demo_mode()
    elif choice == "3":
        print("\n👋 ¡Hasta luego!\n")
    else:
        print("\n❌ Opción inválida\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 ¡Hasta luego!\n")
    except Exception as e:
        print(f"\n❌ Error fatal: {e}\n")
        import traceback
        traceback.print_exc()
