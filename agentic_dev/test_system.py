#!/usr/bin/env python3
"""
Script de prueba para verificar que el sistema de agentes funciona correctamente
"""

import sys
import os
import json

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(__file__))

def test_mysql_connection():
    """Prueba la conexión a MySQL"""
    print("🧪 Probando conexión a MySQL...")
    try:
        from tools.mysql_tool import buscar_servicios_fuzzy
        result = buscar_servicios_fuzzy("dental")
        data = json.loads(result)
        
        if data['success']:
            print(f"✅ Conexión MySQL OK - Encontrados: {data['total']} servicios")
            return True
        else:
            print(f"❌ Error MySQL: {data['error']}")
            return False
    except Exception as e:
        print(f"❌ Error en conexión MySQL: {e}")
        return False

def test_config():
    """Prueba la configuración"""
    print("🧪 Probando configuración...")
    try:
        from config import Config
        print(f"✅ Configuración cargada - API Keys: {bool(Config.ANTHROPIC_API_KEY and Config.DEEPSEEK_API_KEY)}")
        return True
    except Exception as e:
        print(f"❌ Error en configuración: {e}")
        return False

def test_autogen_imports():
    """Prueba las importaciones de AutoGen"""
    print("🧪 Probando importaciones de AutoGen...")
    try:
        from autogen_agentchat.agents import AssistantAgent
        from autogen_agentchat.ui import Console
        from autogen_agentchat.teams import RoundRobinGroupChat
        from autogen_ext.models.openai import OpenAIChatCompletionClient
        
        print("✅ Importaciones de AutoGen OK")
        return True
    except Exception as e:
        print(f"❌ Error en importaciones AutoGen: {e}")
        return False

def test_agent_creation():
    """Prueba la creación de agentes"""
    print("🧪 Probando creación de agentes...")
    try:
        from config import Config
        from autogen_ext.models.openai import OpenAIChatCompletionClient
        
        model_client = OpenAIChatCompletionClient(
            model="deepseek-chat",
            api_key=Config.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
            model_info={
                "vision": False,
                "function_calling": True,
                "json_output": True,
                "family": "unknown",
            }
        )
        
        print("✅ Cliente de modelo creado correctamente")
        return True
    except Exception as e:
        print(f"❌ Error en creación de agente: {e}")
        return False

def main():
    print("🏥 Sistema de Pruebas - Medical&Care Agentic Dev")
    print("=" * 60)
    
    tests = [
        test_config,
        test_mysql_connection,
        test_autogen_imports,
        test_agent_creation
    ]
    
    results = []
    for test in tests:
        results.append(test())
        print()
    
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 ¡Todas las pruebas pasaron! ({passed}/{total})")
        print("\n✅ El sistema está listo para usar agentes con AutoGen")
    else:
        print(f"⚠️  Algunas pruebas fallaron: ({passed}/{total})")
        print("\n❌ Revisa los errores antes de continuar")

if __name__ == "__main__":
    main()
