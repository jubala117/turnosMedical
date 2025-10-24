#!/usr/bin/env python3
"""
Script para crear el archivo .env correctamente sin BOM ni saltos de línea
IMPORTANTE: Este script crea un archivo .env con PLACEHOLDERS
Debes reemplazar los valores con tus API keys reales
"""

env_content = """# Multi-Agent System - Environment Variables
# Copia este archivo a .env y agrega tus API keys

# Anthropic (Claude)
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# OpenAI (GPT-4, GPT-3.5, etc.)
OPENAI_API_KEY=your-openai-api-key-here

# DeepSeek (Modelos especializados en codigo)
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# Google (Gemini)
GOOGLE_API_KEY=your-google-api-key-here

# Nota: Solo necesitas las API keys de los servicios que planeas usar
# El sistema se adaptara automaticamente a las claves disponibles
"""

with open('.env', 'w', encoding='utf-8', newline='\n') as f:
    f.write(env_content)

print("✓ Archivo .env creado exitosamente!")
print("\n⚠️  IMPORTANTE: Reemplaza los placeholders con tus API keys reales")
print("   El archivo .env está en .gitignore y NO se subirá a GitHub")
