# 🔄 Cómo Cambiar Entre Claude y GPT

Este archivo te explica cómo cambiar fácilmente entre Claude y GPT-4 en el sistema.

## 🎯 Configuración Actual

**Por defecto, el sistema usa GPT-4** para ahorrar tus tokens de Claude.

## 📝 Dónde Cambiar los Modelos

### 1️⃣ QuickStart (Modo Interactivo)

**Archivo:** `quickstart.py`

**Líneas 76-90:**

```python
# OPCIÓN 1: GPT-4 (ACTIVA) - Usa OpenAI
if Settings.OPENAI_API_KEY:
    orchestrator_model = "gpt-4o"
    code_model = "deepseek-chat" if Settings.DEEPSEEK_API_KEY else "gpt-4o"
    research_model = "gpt-4o"
    print("✅ Usando GPT-4 como modelo principal")

# OPCIÓN 2: Claude (COMENTADA) - Usa Anthropic
# elif Settings.ANTHROPIC_API_KEY:
#     orchestrator_model = "claude-sonnet-4-5-20250929"
#     code_model = "deepseek-chat" if Settings.DEEPSEEK_API_KEY else "claude-sonnet-4-5-20250929"
#     research_model = "claude-sonnet-4-5-20250929"
#     print("✅ Usando Claude como modelo principal")
```

**Para cambiar a Claude:**
1. Comenta las líneas de GPT-4 (76-82)
2. Descomenta las líneas de Claude (84-90)

### 2️⃣ Ejemplos Básicos

**Archivo:** `examples/basic_usage.py`

**Líneas 28-37:**

```python
# OPCIÓN 1: GPT-4 (ACTIVA)
ORCHESTRATOR_MODEL = "gpt-4o"
RESEARCH_MODEL = "gpt-4o"

# OPCIÓN 2: Claude (COMENTADA)
# ORCHESTRATOR_MODEL = "claude-sonnet-4-5-20250929"
# RESEARCH_MODEL = "claude-sonnet-4-5-20250929"
```

**Para cambiar a Claude:**
1. Comenta las líneas 29-30
2. Descomenta las líneas 33-34

### 3️⃣ Uso Programático

Cuando crees tus propios scripts:

```python
# OPCIÓN A: Usar GPT-4 (ahorra tokens de Claude)
from multi_agent_system import Orchestrator, CodeAgent

orchestrator = Orchestrator(model="gpt-4o")
code_agent = CodeAgent(model="deepseek-chat")

# OPCIÓN B: Usar Claude (cuando tengas más tokens)
# orchestrator = Orchestrator(model="claude-sonnet-4-5-20250929")
# code_agent = CodeAgent(model="deepseek-chat")
```

## 💰 Recomendaciones de Ahorro

### Estrategia Multi-Modelo (Más Barato)

```python
# Orquestador con GPT-4 (más económico para coordinar)
orchestrator = Orchestrator(model="gpt-4o")

# Code Agent con DeepSeek (muy barato, especializado en código)
code_agent = CodeAgent(model="deepseek-chat")

# Research Agent con GPT-4
research_agent = ResearchAgent(model="gpt-4o")
```

**Costos aproximados (por 1M tokens):**
- DeepSeek: $0.14 (MUY barato)
- GPT-4o: $2.50-$10
- Claude Sonnet: $3-$15

### Cuándo Usar Cada Modelo

| Modelo | Mejor Para | Costo |
|--------|------------|-------|
| **DeepSeek** | Código, refactoring, debugging | 💰 |
| **GPT-4o** | Coordinación, análisis general | 💰💰 |
| **Claude Sonnet** | Análisis profundo, razonamiento complejo | 💰💰💰 |

## 🔧 Cambio Rápido

### Opción 1: Editar Directamente

```bash
# Editar quickstart.py
notepad quickstart.py  # Windows
nano quickstart.py     # Linux/Mac

# Buscar la línea "OPCIÓN 1: GPT-4 (ACTIVA)"
# Comentar esa sección, descomentar "OPCIÓN 2: Claude"
```

### Opción 2: Buscar y Reemplazar

```bash
# Puedes usar buscar y reemplazar en tu editor favorito:
# Buscar: "gpt-4o"
# Reemplazar: "claude-sonnet-4-5-20250929"
```

## ⚠️ Importante

1. **API Keys:** Asegúrate de tener la API key correspondiente en el archivo `.env`
2. **Límites:** Claude tiene límites de tokens más estrictos
3. **Costo:** GPT-4 suele ser más económico para tareas simples

## 📋 Verificar Configuración

Ejecuta el quickstart y verás qué modelo está usando:

```bash
python quickstart.py
```

Verás algo como:
```
✅ Usando GPT-4 como modelo principal
   Orquestador: gpt-4o
   Code Agent: deepseek-chat
   Research Agent: gpt-4o
```

## 🎯 Mi Recomendación

**Para ahorrar tokens de Claude:**
- Usa GPT-4 para la mayoría de tareas
- Usa DeepSeek para código
- Guarda Claude para cuando necesites análisis MUY profundo

**Cuando tengas más tokens de Claude:**
- Descomenta las líneas de Claude
- Comenta las de GPT-4
- ¡Listo!

---

¿Necesitas ayuda? Todo está comentado con "OPCIÓN 1" y "OPCIÓN 2" para que sea fácil cambiar.
