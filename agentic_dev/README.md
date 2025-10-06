# Sistema de Agentes AutoGen - Medical&Care

Este sistema implementa agentes inteligentes usando AutoGen 0.10+ para automatizar tareas en el sistema de turnos médicos.

## 🚀 Configuración Rápida

### 1. Activar el entorno virtual
```bash
# En Windows PowerShell
venv\Scripts\Activate.ps1

# En Windows CMD
venv\Scripts\activate.bat

# En Linux/Mac
source venv/bin/activate
```

### 2. Verificar instalación
```bash
cd agentic_dev
python test_system.py
```

### 3. Ejecutar el agente principal
```bash
python main_simple.py
```

## 📁 Estructura del Proyecto

```
agentic_dev/
├── config.py              # Configuración centralizada
├── main_simple.py         # Script principal con agente
├── test_system.py         # Script de pruebas
├── .env                   # Variables de entorno (API keys)
├── servicios_odontologia.txt # Lista de servicios a mapear
├── agents/
│   ├── __init__.py
│   └── coordinator.py     # Coordinador de agentes
└── tools/
    ├── __init__.py
    ├── mysql_tool.py      # Herramientas para MySQL
    └── aider_tool.py      # Herramientas para desarrollo
```

## 🛠️ Herramientas Disponibles

### MySQL Tools (`tools/mysql_tool.py`)
- `buscar_servicios_fuzzy(termino_busqueda)` - Búsqueda difusa de servicios
- `mapear_servicios_desde_lista(lista_servicios)` - Mapeo masivo de servicios
- `buscar_con_similitud(termino, umbral=0.6)` - Búsqueda con algoritmo de similitud
- `obtener_estructura_tabla(tabla)` - Obtener estructura de tablas

### Configuración (`config.py`)
- API Keys para Anthropic (Claude) y DeepSeek
- Configuración de base de datos MySQL
- Configuraciones predefinidas para modelos

## 🤖 Agentes Implementados

### Agente BuscadorServicios
- **Propósito**: Mapear servicios médicos a IDs de base de datos
- **Herramientas**: Todas las herramientas MySQL
- **Modelo**: DeepSeek (configurable)
- **Tarea**: Automatizar el mapeo de servicios desde listas de texto

## 🔧 Uso Básico

### 1. Mapeo de servicios de odontología
```python
from main_simple import mapear_odontologia

# Mapea servicios desde archivo
mapear_odontologia("servicios_odontologia.txt")
```

### 2. Uso directo de herramientas
```python
from tools.mysql_tool import buscar_servicios_fuzzy
import json

result = buscar_servicios_fuzzy("dental")
data = json.loads(result)
print(f"Encontrados: {data['total']} servicios")
```

### 3. Creación de agentes personalizados
```python
from config import Config
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_agentchat.agents import AssistantAgent

# Crear cliente de modelo
model_client = OpenAIChatCompletionClient(
    model="deepseek-chat",
    api_key=Config.DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com"
)

# Crear agente
agente = AssistantAgent(
    name="MiAgente",
    model_client=model_client,
    system_message="Eres un asistente especializado...",
    tools=[...]  # Lista de herramientas
)
```

## 🔒 Variables de Entorno

Crear archivo `.env` en `agentic_dev/`:
```
ANTHROPIC_API_KEY=tu_clave_anthropic
DEEPSEEK_API_KEY=tu_clave_deepseek
```

## 📊 Base de Datos

El sistema se conecta a la base de datos MySQL `medicalcare` con:
- Host: 127.0.0.1
- User: root
- Password: (vacío)
- Database: medicalcare

## 🎯 Casos de Uso

### Mapeo Automático de Servicios
1. Preparar lista de servicios en archivo `.txt`
2. Ejecutar `main_simple.py`
3. El agente mapea automáticamente cada servicio a su ID en la BD

### Búsqueda Inteligente
- Búsqueda difusa para nombres similares
- Algoritmo de similitud para coincidencias aproximadas
- Mapeo masivo desde listas

## 🚨 Solución de Problemas

### Error de conexión a MySQL
- Verificar que MySQL esté ejecutándose
- Confirmar credenciales en `config.py`

### Error de API Key
- Verificar que las claves estén en `.env`
- Confirmar que el archivo `.env` esté en `agentic_dev/`

### Error de importación
- Activar el entorno virtual
- Verificar que todas las dependencias estén instaladas

## 🔄 Expansión del Sistema

Para agregar nuevos agentes:
1. Crear archivo en `agents/`
2. Definir herramientas en `tools/`
3. Actualizar `config.py` si es necesario
4. Integrar en `main_simple.py` o crear nuevo script

---

**Estado**: ✅ Sistema funcional y listo para usar
**Versión AutoGen**: 0.7.5
**Python**: 3.x
