# Guía Completa: AutoGen API y Sistema de Agentes

**Fecha:** 7 de Enero, 2025  
**Basado en:** Implementación actual en `agentic_dev/`

---

## 📋 Índice

1. [Introducción a AutoGen](#introducción-a-autogen)
2. [API Correcta para AutoGen 0.10+](#api-correcta-para-autogen-010)
3. [Setup Completo del Proyecto](#setup-completo-del-proyecto)
4. [Arquitectura de Agentes](#arquitectura-de-agentes)
5. [Herramientas y Funciones](#herramientas-y-funciones)
6. [Flujos de Trabajo](#flujos-de-trabajo)
7. [Configuración para Otros Proyectos](#configuración-para-otros-proyectos)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Introducción a AutoGen

### ¿Qué es AutoGen?
AutoGen es un framework de Microsoft para crear sistemas de agentes conversacionales que pueden colaborar para resolver tareas complejas.

### Versiones Importantes
- **AutoGen 0.1-0.9**: API antigua (obsoleta)
- **AutoGen 0.10+**: API completamente nueva y modular

### Tu Implementación Actual
Tu proyecto usa **AutoGen 0.10+** con:
- Agentes especializados
- Herramientas personalizadas
- Flujos de trabajo colaborativos
- Integración con MySQL

---

## 🔧 API Correcta para AutoGen 0.10+

### Imports Correctos
```python
# ✅ CORRECTO - AutoGen 0.10+
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.ui import Console
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.models.openai import OpenAIChatCompletionClient
```

### Configuración de Modelos

#### Para DeepSeek (OpenAI-compatible)
```python
model_client = OpenAIChatCompletionClient(
    model="deepseek-chat",
    api_key="tu_api_key",
    base_url="https://api.deepseek.com",  # ✅ Sin /v1
    model_info={
        "vision": False,
        "function_calling": True,
        "json_output": True,
        "family": "unknown",
    }
)
```

#### Para Claude (Anthropic)
```python
model_client = OpenAIChatCompletionClient(
    model="claude-sonnet-4-5",
    api_key="tu_api_key",
    base_url="https://api.anthropic.com/v1",  # ✅ Con /v1
    model_info={
        "vision": False,
        "function_calling": True,
        "json_output": True,
        "family": "unknown",
    }
)
```

#### Para OpenAI
```python
model_client = OpenAIChatCompletionClient(
    model="gpt-4",
    api_key="tu_api_key",
    base_url="https://api.openai.com/v1",  # ✅ Con /v1
    model_info={
        "vision": False,
        "function_calling": True,
        "json_output": True,
        "family": "gpt-4",
    }
)
```

---

## 🛠️ Setup Completo del Proyecto

### 1. Estructura de Directorios
```
tu_proyecto/
├── config.py              # Configuración centralizada
├── main_simple.py         # Pipeline simple
├── main_advanced.py       # Sistema avanzado
├── agents/
│   ├── __init__.py
│   ├── coordinator.py     # Coordinador de agentes
│   └── data_analyzer.py   # Agente analista
├── tools/
│   ├── __init__.py
│   ├── mysql_tool.py      # Herramientas MySQL
│   └── price_analyzer.py  # Análisis de precios
└── .env                   # Variables de entorno
```

### 2. Configuración (`config.py`)
```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Keys
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    
    # Base de datos
    DB_CONFIG = {
        "host": "127.0.0.1",
        "user": "root",
        "password": "",
        "database": "tu_base_datos"
    }
    
    # Configuraciones específicas del proyecto
    PROJECT_ROOT = "ruta/a/tu/proyecto"
    
    @staticmethod
    def get_deepseek_config():
        return {
            "config_list": [
                {
                    "model": "deepseek-chat",
                    "api_key": Config.DEEPSEEK_API_KEY,
                    "base_url": "https://api.deepseek.com",
                    "api_type": "openai",
                }
            ],
            "temperature": 0.5,
        }
```

### 3. Variables de Entorno (`.env`)
```env
ANTHROPIC_API_KEY=tu_clave_anthropic
DEEPSEEK_API_KEY=tu_clave_deepseek
```

### 4. Dependencias (`requirements.txt`)
```txt
autogen-core>=0.1.0
autogen-agentchat>=0.1.0
autogen-ext>=0.1.0
python-dotenv>=1.0.0
mysql-connector-python>=8.0.0
```

---

## 🤖 Arquitectura de Agentes

### Agente Base
```python
def crear_agente_buscador():
    system_message = """Eres un Agente especializado en [tu dominio específico].

CONTEXTO:
- [Contexto específico del dominio]

TUS HERRAMIENTAS:
1. herramienta_1(parametro: tipo) -> descripción
2. herramienta_2(parametro: tipo) -> descripción

TAREA:
- [Descripción clara de la tarea]
- [Pasos específicos a seguir]
"""

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
    
    agent = AssistantAgent(
        name="NombreDelAgente",
        model_client=model_client,
        system_message=system_message,
        tools=[
            # Lista de herramientas
        ],
    )
    
    return agent
```

### Tipos de Agentes Comunes

#### 1. Agente Buscador
- **Propósito**: Buscar y mapear datos
- **Herramientas**: Búsqueda en BD, similitud, fuzzy search
- **Ejemplo**: `BuscadorServicios` en tu proyecto

#### 2. Agente Analista
- **Propósito**: Analizar resultados y patrones
- **Herramientas**: Análisis estadístico, categorización
- **Ejemplo**: `AnalistaDatosMedicos`

#### 3. Agente Optimizador
- **Propósito**: Sugerir mejoras y optimizaciones
- **Herramientas**: Análisis de precios, recomendaciones
- **Ejemplo**: `OptimizadorServicios`

---

## 🛠️ Herramientas y Funciones

### Estructura de Herramientas
```python
from typing import Annotated
import json

def mi_herramienta(
    parametro: Annotated[str, "Descripción del parámetro"]
) -> str:
    """
    Descripción clara de lo que hace la herramienta.
    
    Args:
        parametro: Explicación del parámetro
        
    Returns:
        JSON con resultados
    """
    try:
        # Lógica de la herramienta
        resultado = {
            "success": True,
            "data": "resultado",
            "metadata": "información adicional"
        }
        return json.dumps(resultado, ensure_ascii=False)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })
```

### Ejemplo: Herramienta MySQL
```python
def buscar_datos_fuzzy(
    termino_busqueda: Annotated[str, "Término a buscar"]
) -> str:
    """
    Busca datos en MySQL con búsqueda difusa.
    
    Args:
        termino_busqueda: Término a buscar
        
    Returns:
        JSON con resultados de búsqueda
    """
    conn = get_connection()
    if not conn:
        return json.dumps({
            "success": False,
            "error": "Error de conexión"
        })
    
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM tabla WHERE campo LIKE %s"
        cursor.execute(query, (f"%{termino_busqueda}%",))
        resultados = cursor.fetchall()
        
        return json.dumps({
            "success": True,
            "resultados": resultados,
            "total": len(resultados)
        }, default=str)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })
```

### Conexión a Base de Datos
```python
def get_connection():
    """Obtiene conexión a MySQL"""
    try:
        conn = mysql.connector.connect(**Config.DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error conectando a MySQL: {e}")
        return None
```

---

## 🔄 Flujos de Trabajo

### Flujo Simple (1 Agente)
```python
async def flujo_simple():
    # Crear agente
    agente = crear_agente_buscador()
    
    # Crear team
    team = RoundRobinGroupChat([agente])
    
    # Ejecutar
    mensaje = "Tu tarea específica aquí"
    stream = team.run_stream(task=mensaje)
    await Console(stream)
```

### Flujo Completo (Múltiples Agentes)
```python
async def flujo_completo():
    # Crear equipo
    buscador = crear_agente_buscador()
    analista = crear_agente_analista()
    optimizador = crear_agente_optimizador()
    
    team = RoundRobinGroupChat([buscador, analista, optimizador])
    
    # Mensaje estructurado
    mensaje = """
OBJETIVO: [Objetivo claro]

FLUJO DE TRABAJO:

AGENTE BUSCADOR:
1. [Tarea específica 1]
2. [Tarea específica 2]

AGENTE ANALISTA:
1. [Análisis de resultados]
2. [Identificación de patrones]

AGENTE OPTIMIZADOR:
1. [Sugerencias de mejora]
2. [Recomendaciones]

COLABORACIÓN: [Instrucciones de colaboración]
"""
    
    stream = team.run_stream(task=mensaje)
    await Console(stream)
```

### Wrapper Síncrono
```python
def ejecutar_flujo_sincrono():
    """Wrapper para ejecución síncrona"""
    return asyncio.run(flujo_completo())
```

---

## 🎯 Configuración para Otros Proyectos

### 1. Proyecto de E-commerce
```python
# config.py
class EcommerceConfig:
    DB_CONFIG = {
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "ecommerce_db"
    }
    
    # Agentes específicos
    @staticmethod
    def crear_agente_catalogo():
        system_message = """Eres un Agente especializado en catálogo de productos..."""
        # Implementación similar

# tools/ecommerce_tools.py
def buscar_productos_fuzzy(termino: str) -> str:
    """Busca productos en catálogo"""
    # Implementación específica
```

### 2. Proyecto de Análisis de Datos
```python
# config.py
class DataAnalysisConfig:
    DB_CONFIG = {
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "analytics_db"
    }
    
    # Agentes para análisis
    @staticmethod
    def crear_agente_estadistico():
        system_message = """Eres un Agente especializado en análisis estadístico..."""

# tools/analysis_tools.py
def analizar_tendencia(datos: list) -> str:
    """Analiza tendencias en datos"""
    # Implementación específica
```

### 3. Proyecto de Customer Support
```python
# config.py
class SupportConfig:
    DB_CONFIG = {
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "support_db"
    }
    
    # Agentes para soporte
    @staticmethod
    def crear_agente_soporte():
        system_message = """Eres un Agente de soporte al cliente..."""

# tools/support_tools.py
def buscar_ticket(id_ticket: str) -> str:
    """Busca información de ticket"""
    # Implementación específica
```

---

## 💡 Mejores Prácticas

### 1. System Messages Efectivas
```python
# ✅ BUENO - Específico y estructurado
system_message = """Eres un Agente especializado en [dominio].

CONTEXTO:
- Base de datos: [nombre_db]
- Tablas principales: [lista_tablas]

TUS HERRAMIENTAS:
1. [herramienta_1]: [descripción]
2. [herramienta_2]: [descripción]

TAREA:
- [Paso 1 específico]
- [Paso 2 específico]
- [Criterios de éxito]
"""

# ❌ MALO - Genérico
system_message = "Eres un asistente útil."
```

### 2. Manejo de Errores en Herramientas
```python
def herramienta_robusta(parametro: str) -> str:
    try:
        # Lógica principal
        resultado = hacer_algo(parametro)
        return json.dumps({
            "success": True,
            "data": resultado
        })
        
    except Exception as e:
        # Log del error
        print(f"Error en herramienta: {e}")
        
        # Respuesta estructurada de error
        return json.dumps({
            "success": False,
            "error": str(e),
            "suggestion": "Intenta con otro parámetro"
        })
```

### 3. Documentación de Herramientas
```python
def herramienta_bien_documentada(
    parametro: Annotated[str, "Descripción clara del parámetro"],
    opcional: Annotated[int, "Parámetro opcional"] = 0
) -> str:
    """
    Descripción clara de lo que hace la herramienta.
    
    Args:
        parametro: Explicación detallada
        opcional: Explicación del valor por defecto
        
    Returns:
        JSON con estructura específica:
        {
            "success": bool,
            "data": cualquier_dato,
            "metadata": info_adicional
        }
        
    Examples:
        >>> herramienta_bien_documentada("ejemplo")
        '{"success": true, "data": [...]}'
    """
```

### 4. Configuración Modular
```python
class ConfigModular:
    @staticmethod
    def get_model_config(provider: str, model: str):
        """Configuración modular para diferentes modelos"""
        configs = {
            "deepseek": {
                "base_url": "https://api.deepseek.com",
                "model_info": {...}
            },
            "openai": {
                "base_url": "https://api.openai.com/v1",
                "model_info": {...}
            },
            "anthropic": {
                "base_url": "https://api.anthropic.com/v1",
                "model_info": {...}
            }
        }
        return configs.get(provider, configs["deepseek"])
```

---

## 🐛 Solución de Problemas

### Errores Comunes y Soluciones

#### 1. Error: "ModuleNotFoundError: No module named 'autogen'"
**Solución:**
```bash
# Instalar AutoGen 0.10+
pip install autogen-core autogen-agentchat autogen-ext
```

#### 2. Error: "API key not found"
**Solución:**
```python
# Verificar .env
from dotenv import load_dotenv
load_dotenv()  # ✅ Esto debe ir al inicio

# Verificar variable
import os
print(os.getenv("DEEPSEEK_API_KEY"))  # Debe mostrar la clave
```

#### 3. Error: "Connection refused" en MySQL
**Solución:**
```python
# Verificar configuración
DB_CONFIG = {
    "host": "127.0.0.1",  # ✅ No "localhost"
    "user": "root",
    "password": "",       # ✅ Password vacío si no hay
    "database": "nombre_db"
}

# Probar conexión manualmente
import mysql.connector
conn = mysql.connector.connect(**DB_CONFIG)
```

#### 4. Error: "Model not found" en DeepSeek
**Solución:**
```python
# ✅ Configuración correcta para DeepSeek
model_client = OpenAIChatCompletionClient(
    model="deepseek-chat",           # ✅ Modelo correcto
    api_key="tu_clave",
    base_url="https://api.deepseek.com",  # ✅ Sin /v1
    model_info={...}
)
```

#### 5. Error: Las herramientas no se ejecutan
**Solución:**
```python
# Verificar que las herramientas estén bien definidas
def herramienta(
    parametro: Annotated[str, "Desc
