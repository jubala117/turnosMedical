# 🤖 Multi-Agent System

Sistema de agentes multi-modelo inspirado en Claude Code. Soporta múltiples APIs (Claude, OpenAI, DeepSeek, Gemini) y permite crear sistemas de agentes especializados que trabajan en conjunto.

## 🌟 Características Principales

- **Multi-Modelo**: Usa Claude, GPT-4, DeepSeek, Gemini, etc. en el mismo sistema
- **Orquestador Inteligente**: Agente principal que coordina a agentes especializados
- **Agentes Especializados**: Code, Research, Database, y más
- **Sistema de Herramientas**: Tools extensibles para diferentes tareas
- **Gestión de Contexto**: Manejo automático del límite de tokens
- **Fácil de Extender**: Crea tus propios agentes y herramientas

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│       USUARIO                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    ORCHESTRATOR (Claude/GPT-4)      │
│  - Coordina agentes                 │
│  - Herramientas básicas             │
│  - Gestión de contexto              │
└──────────┬──────────────────────────┘
           │
           ├─────────┬─────────┬───────┐
           │         │         │       │
           ▼         ▼         ▼       ▼
     ┌─────────┐ ┌────────┐ ┌──────┐ ...
     │  CODE   │ │RESEARCH│ │  DB  │
     │ Agent   │ │ Agent  │ │Agent │
     │(DeepSeek)│(Claude) │(GPT-3)│
     └─────────┘ └────────┘ └──────┘
```

## 🚀 Instalación Rápida

### 1. Instalar dependencias

```bash
# Desde el directorio multi_agent_system/
pip install -r requirements.txt
```

### 2. Configurar API Keys

Crea un archivo `.env` en el directorio `multi_agent_system/`:

```bash
# Copiar el ejemplo
cp .env.example .env

# Editar y agregar tus claves
# En Windows: notepad .env
# En Linux/Mac: nano .env
```

```env
ANTHROPIC_API_KEY=tu_clave_anthropic
OPENAI_API_KEY=tu_clave_openai
DEEPSEEK_API_KEY=tu_clave_deepseek
# GOOGLE_API_KEY=tu_clave_google (opcional)
```

### 3. Probar el Sistema

**Opción A: Quickstart Interactivo (Recomendado)**

```bash
# Desde el directorio multi_agent_system/
python quickstart.py
```

**Opción B: Ejecutar Ejemplos**

```bash
# Desde el directorio multi_agent_system/
python examples/basic_usage.py
python examples/advanced_usage.py
```

**Opción C: Ejecutar Tests**

```bash
# Desde el directorio multi_agent_system/
python test_system.py
```

### 4. Uso Básico en tu Código

```python
from multi_agent_system.core.orchestrator import Orchestrator
from multi_agent_system.agents.code_agent import CodeAgent

# Crear orquestador
orchestrator = Orchestrator(model="claude-sonnet-4-5-20250929")

# Registrar agente especializado
code_agent = CodeAgent(model="deepseek-chat")
orchestrator.register_agent("code", code_agent)

# Usar el sistema
response = orchestrator.chat("Analiza el proyecto y crea un README")
print(response)
```

## 📁 Estructura del Proyecto

```
multi_agent_system/
├── core/
│   ├── api_client.py         # Cliente multi-API
│   ├── base_agent.py         # Clase base para agentes
│   ├── context_manager.py    # Gestión de contexto
│   └── orchestrator.py       # Orquestador principal
├── agents/
│   ├── code_agent.py         # Agente de código
│   └── research_agent.py     # Agente de investigación
├── tools/
│   ├── base_tool.py          # Clase base para tools
│   ├── file_tools.py         # Operaciones de archivos
│   ├── search_tools.py       # Búsqueda (grep, glob)
│   └── bash_tool.py          # Comandos bash
├── config/
│   └── settings.py           # Configuración
└── examples/
    ├── basic_usage.py        # Ejemplos básicos
    └── advanced_usage.py     # Ejemplos avanzados
```

## 🎯 Casos de Uso

### 1. Análisis de Código

```python
orchestrator = Orchestrator()
orchestrator.register_agent("code", CodeAgent())

response = orchestrator.chat(
    "Analiza todos los archivos Python y dime si hay código duplicado"
)
```

### 2. Generación de Documentación

```python
orchestrator = Orchestrator()
orchestrator.register_agent("research", ResearchAgent())

response = orchestrator.chat(
    "Genera documentación completa para este proyecto"
)
```

### 3. Refactorización

```python
code_agent = CodeAgent(model="deepseek-coder")
response = code_agent.chat(
    "Refactoriza el archivo main.py para mejorar la legibilidad"
)
```

### 4. Workflow Complejo

```python
orchestrator = Orchestrator()
orchestrator.register_agent("code", CodeAgent())
orchestrator.register_agent("research", ResearchAgent())

# El orquestador coordinará automáticamente
response = orchestrator.chat(
    "Analiza el proyecto, identifica mejoras, "
    "implementa las cambios, y documenta todo"
)
```

## 🛠️ Agentes Disponibles

### Orchestrator (Agente Principal)

- **Modelo recomendado**: Claude Sonnet, GPT-4o
- **Función**: Coordina otros agentes, maneja tareas simples directamente
- **Herramientas**: Archivos, búsqueda, bash, delegación

### CodeAgent

- **Modelo recomendado**: DeepSeek Coder, Claude
- **Función**: Tareas de código (leer, escribir, editar, buscar)
- **Herramientas**: Archivos, grep, glob, bash

### ResearchAgent

- **Modelo recomendado**: Claude, GPT-4o
- **Función**: Investigación, análisis, documentación
- **Herramientas**: Archivos, búsqueda, exploración

## 🔧 Herramientas (Tools)

### Archivos
- `read_file`: Lee archivos
- `write_file`: Escribe archivos
- `edit_file`: Edita archivos (búsqueda y reemplazo)
- `list_directory`: Lista contenido de directorios

### Búsqueda
- `grep`: Busca patrones en archivos (regex)
- `glob`: Busca archivos por patrón
- `find_file`: Busca archivos por nombre

### Sistema
- `bash`: Ejecuta comandos bash

### Delegación
- `delegate_to_agent`: Delega tareas a agentes especializados

## 📊 Modelos Soportados

| Proveedor | Modelos | Mejor Para |
|-----------|---------|------------|
| **Anthropic** | Claude Sonnet, Opus, Haiku | Coordinación, análisis, conversación |
| **OpenAI** | GPT-4o, GPT-4, GPT-3.5 | Tareas generales, razonamiento |
| **DeepSeek** | DeepSeek Chat, Coder | Código, tareas técnicas |
| **Google** | Gemini Pro, Flash | Alternativa económica |

## 💡 Ejemplos Avanzados

### Crear un Agente Personalizado

```python
from multi_agent_system.core.base_agent import BaseAgent
from multi_agent_system.tools.base_tool import BaseTool

class MiAgente(BaseAgent):
    def __init__(self, model="gpt-4o"):
        system_message = "Eres un agente especializado en..."
        tools = [MiHerramientaPersonalizada()]

        super().__init__(
            name="MiAgente",
            model=model,
            system_message=system_message,
            tools=tools
        )

    def get_capabilities(self):
        return ["Capacidad 1", "Capacidad 2"]
```

### Crear una Herramienta Personalizada

```python
from multi_agent_system.tools.base_tool import BaseTool

class MiHerramienta(BaseTool):
    def __init__(self):
        super().__init__(
            name="mi_herramienta",
            description="Descripción de la herramienta"
        )

    def execute(self, parametro1: str) -> str:
        # Tu lógica aquí
        return f"Resultado con {parametro1}"

    def get_schema(self):
        return {
            "type": "object",
            "properties": {
                "parametro1": {
                    "type": "string",
                    "description": "Descripción del parámetro"
                }
            },
            "required": ["parametro1"]
        }
```

### Usar Diferentes Modelos para Diferentes Tareas

```python
# Orquestador con Claude (mejor coordinación)
orchestrator = Orchestrator(model="claude-sonnet-4-5-20250929")

# Code Agent con DeepSeek (especializado en código)
code_agent = CodeAgent(model="deepseek-coder")

# Research Agent con GPT-4o (buen análisis)
research_agent = ResearchAgent(model="gpt-4o")

orchestrator.register_agent("code", code_agent)
orchestrator.register_agent("research", research_agent)

# Cada agente usará su modelo especializado automáticamente
```

## 🔍 Cómo Funciona

1. **Usuario envía mensaje** al Orchestrator
2. **Orchestrator analiza** la tarea
3. **Decisión**:
   - ¿Tarea simple? → Usa herramientas directamente
   - ¿Tarea compleja? → Delega a agente especializado
4. **Agente especializado** ejecuta la tarea usando sus herramientas
5. **Resultados** se devuelven al Orchestrator
6. **Orchestrator sintetiza** y responde al usuario

## 📈 Gestión de Contexto

El sistema gestiona automáticamente el contexto:

- **Límites de tokens**: Configurados por modelo
- **Optimización automática**: Cuando se llena el contexto
- **Estrategias**:
  - Mantener mensajes más recientes
  - Eliminar mensajes antiguos
  - Resumen de conversaciones (opcional)

```python
# Ver estado del contexto
summary = agent.get_context_summary()
print(f"Tokens: {summary['total_tokens']}/{summary['max_tokens']}")
print(f"Uso: {summary['usage_percentage']:.1f}%")

# Limpiar contexto
agent.clear_context()
```

## 🎓 Conceptos Clave

### Orquestador vs Agente Especializado

- **Orquestador**: Interfaz principal, coordina, toma decisiones
- **Agente Especializado**: Experto en dominio específico, ejecuta tareas

### Cuándo Delegar

El orquestador delega cuando:
- La tarea es compleja (múltiples pasos)
- Requiere expertise especializado
- Involucra operaciones repetitivas
- Necesita análisis profundo

### Tool Calling

Los agentes usan herramientas para:
- Interactuar con el sistema (archivos, bash)
- Buscar información (grep, glob)
- Ejecutar operaciones especializadas
- Delegar a otros agentes

## 🚨 Troubleshooting

### Error: API Key no configurada

```python
# Solución: Verifica tu archivo .env
# Asegúrate que tiene las claves correctas
```

### Error: Modelo no encontrado

```python
# Solución: Verifica que el modelo esté en config/settings.py
# O usa uno de los modelos pre-configurados
```

### Contexto lleno

```python
# Solución 1: El sistema optimiza automáticamente
# Solución 2: Limpia el contexto manualmente
agent.clear_context()
```

## 📝 Roadmap

- [ ] Streaming de respuestas
- [ ] Persistencia de conversaciones
- [ ] Agentes en paralelo (async)
- [ ] Más agentes especializados (Web, DB, etc.)
- [ ] Dashboard web para monitoreo
- [ ] Integración con más APIs

## 🤝 Contribuir

Este es un proyecto educativo. Si quieres extenderlo:

1. Crea nuevos agentes en `agents/`
2. Crea nuevas herramientas en `tools/`
3. Actualiza la configuración en `config/settings.py`
4. Agrega ejemplos en `examples/`

## 📄 Licencia

Proyecto educativo - Libre de usar y modificar

## 🙏 Inspiración

Este proyecto está inspirado en:
- **Claude Code**: La arquitectura de agentes y herramientas
- **AutoGen**: El concepto de multi-agentes
- **LangChain**: El sistema de tools y chains

## 📚 Recursos

- [Documentación Anthropic](https://docs.anthropic.com)
- [OpenAI API](https://platform.openai.com/docs)
- [DeepSeek](https://www.deepseek.com)

---

**Creado con** ❤️ **usando Claude Code**
