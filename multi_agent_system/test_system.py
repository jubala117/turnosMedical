#!/usr/bin/env python3
"""
Test básico del Multi-Agent System

Verifica que todos los componentes se importen correctamente.
"""
import sys
import os

# Fix para imports - agregar directorio padre al path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

print("🧪 Testing Multi-Agent System...\n")

# Test 1: Imports básicos
print("1️⃣ Testing imports...")
try:
    from multi_agent_system.config.settings import Settings
    from multi_agent_system.core.api_client import MultiAPIClient
    from multi_agent_system.core.context_manager import ContextManager
    from multi_agent_system.core.base_agent import BaseAgent
    from multi_agent_system.core.orchestrator import Orchestrator
    print("   ✅ Core imports OK")
except Exception as e:
    print(f"   ❌ Core imports FAILED: {e}")
    sys.exit(1)

# Test 2: Agents
print("\n2️⃣ Testing agents...")
try:
    from multi_agent_system.agents.code_agent import CodeAgent
    from multi_agent_system.agents.research_agent import ResearchAgent
    print("   ✅ Agents imports OK")
except Exception as e:
    print(f"   ❌ Agents imports FAILED: {e}")
    sys.exit(1)

# Test 3: Tools
print("\n3️⃣ Testing tools...")
try:
    from multi_agent_system.tools.base_tool import BaseTool, ToolRegistry
    from multi_agent_system.tools.file_tools import ReadFileTool, WriteFileTool
    from multi_agent_system.tools.search_tools import GrepTool, GlobTool
    from multi_agent_system.tools.bash_tool import BashTool
    print("   ✅ Tools imports OK")
except Exception as e:
    print(f"   ❌ Tools imports FAILED: {e}")
    sys.exit(1)

# Test 4: Configuración
print("\n4️⃣ Testing configuration...")
try:
    # Verificar que la config se carga
    models = Settings.MODELS
    assert "claude" in models
    assert "openai" in models
    assert "deepseek" in models
    print("   ✅ Configuration OK")
except Exception as e:
    print(f"   ❌ Configuration FAILED: {e}")
    sys.exit(1)

# Test 5: API Keys (advertencia si no están)
print("\n5️⃣ Checking API keys...")
api_keys = {
    "Anthropic": Settings.ANTHROPIC_API_KEY,
    "OpenAI": Settings.OPENAI_API_KEY,
    "DeepSeek": Settings.DEEPSEEK_API_KEY,
    "Google": Settings.GOOGLE_API_KEY
}

available = sum(1 for key in api_keys.values() if key)
if available > 0:
    print(f"   ✅ {available} API key(s) configured")
    for name, key in api_keys.items():
        if key:
            print(f"      ✓ {name}")
else:
    print("   ⚠️  No API keys configured (expected for testing)")
    print("      Configure keys in .env to use the system")

# Test 6: Crear herramienta de prueba
print("\n6️⃣ Testing tool creation...")
try:
    read_tool = ReadFileTool()
    assert read_tool.name == "read_file"
    schema = read_tool.get_schema()
    assert "properties" in schema
    print("   ✅ Tool creation OK")
except Exception as e:
    print(f"   ❌ Tool creation FAILED: {e}")
    sys.exit(1)

# Test 7: Context Manager
print("\n7️⃣ Testing context manager...")
try:
    context = ContextManager(max_tokens=1000)
    context.add_message("user", "Test message")
    assert len(context.messages) == 1
    summary = context.get_summary()
    assert summary["total_messages"] == 1
    print("   ✅ Context manager OK")
except Exception as e:
    print(f"   ❌ Context manager FAILED: {e}")
    sys.exit(1)

# Resumen
print("\n" + "="*60)
print("✅ ALL TESTS PASSED!")
print("="*60)
print("\n📋 System ready to use!")
print("\nNext steps:")
print("  1. Configure API keys in .env")
print("  2. Run: python quickstart.py")
print("  3. Or try: python examples/basic_usage.py")
print("")
