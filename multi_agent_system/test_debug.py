import sys
import os

# Fix para imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

print("🔍 Testing imports...")

try:
    from multi_agent_system.tools.base_tool import BaseTool
    print("✅ BaseTool imported")
    
    from multi_agent_system.core.orchestrator import DelegateToAgentTool
    print("✅ DelegateToAgentTool imported")
    
    # Test de creación
    class FakeOrchestrator:
        pass
    
    tool = DelegateToAgentTool(FakeOrchestrator())
    print(f"✅ DelegateToAgentTool creado")
    print(f"   name: {tool.name}")
    print(f"   description: {tool.description}")
    
    # Test de schema
    schema = tool.get_schema()
    print(f"✅ Schema obtenido: {list(schema.keys())}")
    
    # Test de formato
    anthropic_format = tool.to_anthropic_format()
    print(f"✅ Formato Anthropic: {list(anthropic_format.keys())}")
    
    openai_format = tool.to_openai_format()
    print(f"✅ Formato OpenAI: {list(openai_format.keys())}")
    
    print("\n✅ ¡TODO FUNCIONA! El problema debe ser el caché.")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()