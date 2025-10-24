# 🚀 Guía Rápida - Windows

## ✅ Solución al Error de Imports

El error que viste es común en Python cuando se ejecutan scripts desde dentro de un paquete. Ya lo he corregido.

## 📝 Instrucciones Paso a Paso

### 1. Navega al directorio correcto

```powershell
cd C:\xampp\htdocs\turnosMedical\multi_agent_system
```

### 2. Instala las dependencias (si aún no lo hiciste)

```powershell
pip install -r requirements.txt
```

### 3. Configura tus API Keys

```powershell
# Copia el archivo de ejemplo
copy .env.example .env

# Edita el archivo .env con tu editor favorito
notepad .env
```

Agrega tus claves:
```
ANTHROPIC_API_KEY=sk-ant-tu-clave-aqui
OPENAI_API_KEY=sk-tu-clave-aqui
DEEPSEEK_API_KEY=tu-clave-aqui
```

### 4. Ejecuta el Quickstart

```powershell
python quickstart.py
```

Deberías ver:

```
╔═══════════════════════════════════════════════════════════╗
║           🤖 Multi-Agent System                          ║
╚═══════════════════════════════════════════════════════════╝

🔍 Verificando API keys...

✅ Anthropic (Claude)
✅ OpenAI (GPT)

Selecciona un modo:
  1. Modo Interactivo (recomendado)
  2. Modo Demo (ejemplos predefinidos)
  3. Salir
```

### 5. Usa el Modo Interactivo

Selecciona opción `1` y empieza a chatear:

```
💬 Tú: ¿Cuántos archivos Python hay en mi proyecto?
🤖 Asistente: [Responde usando las herramientas...]

💬 Tú: Lista los archivos en el directorio actual
🤖 Asistente: [Ejecuta list_directory y responde...]
```

**Comandos especiales:**
- `/help` - Ayuda
- `/status` - Estado del sistema
- `/clear` - Limpiar contexto
- `/quit` - Salir

## 🎯 Ejemplos de Uso

### Ejecutar ejemplos básicos

```powershell
python examples\basic_usage.py
```

### Ejecutar ejemplos avanzados

```powershell
python examples\advanced_usage.py
```

### Ejecutar tests

```powershell
python test_system.py
```

## 🛠️ Uso Programático

Crea tu propio script `mi_agente.py`:

```python
from multi_agent_system import Orchestrator, CodeAgent

# Crear orquestador con Claude
orchestrator = Orchestrator(model="claude-sonnet-4-5-20250929")

# Agregar Code Agent con DeepSeek
code_agent = CodeAgent(model="deepseek-chat")
orchestrator.register_agent("code", code_agent)

# Chatear
response = orchestrator.chat("Analiza mi proyecto")
print(response)
```

Ejecuta:
```powershell
python mi_agente.py
```

## ⚠️ Troubleshooting

### Error: "No module named 'anthropic'"

```powershell
pip install anthropic openai python-dotenv
```

### Error: "API key not found"

Verifica que el archivo `.env` esté en el directorio `multi_agent_system/` y tenga tus claves.

### Error: "attempted relative import"

Asegúrate de estar ejecutando los scripts DESDE el directorio `multi_agent_system/`:

```powershell
# Correcto
cd C:\xampp\htdocs\turnosMedical\multi_agent_system
python quickstart.py

# Incorrecto
cd C:\xampp\htdocs\turnosMedical
python multi_agent_system\quickstart.py  # ❌ No funciona así
```

## 💡 Tips

1. **Ahorra dinero**: Usa DeepSeek para tareas de código (más barato que Claude/GPT-4)
2. **Mejor análisis**: Usa Claude para análisis complejos
3. **Modo demo**: Si no tienes API keys, usa el modo demo para ver cómo funciona

## 📞 ¿Necesitas Ayuda?

Si algo no funciona, verifica:
1. ✅ Estás en el directorio correcto (`multi_agent_system/`)
2. ✅ Instalaste las dependencias
3. ✅ Configuraste el archivo `.env`
4. ✅ Tienes al menos una API key válida

---

¡Listo para empezar! 🚀
