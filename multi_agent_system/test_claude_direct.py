#!/usr/bin/env python3
"""
Test directo de la API de Claude
Para verificar si la API key funciona
"""
import os
from pathlib import Path
from dotenv import load_dotenv

print("="*60)
print("TEST DIRECTO DE CLAUDE")
print("="*60)

# Cargar .env desde el directorio actual (multi_agent_system/)
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)
print(f"\nCargando .env desde: {env_path}")

api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key:
    print("\nERROR: No hay ANTHROPIC_API_KEY en el archivo .env")
    exit(1)

print(f"\nAPI Key encontrada: {api_key[:15]}...{api_key[-10:]}")
print(f"Longitud: {len(api_key)} caracteres")

# Test 1: Importar anthropic
print("\n[1/3] Importando librería anthropic...")
try:
    from anthropic import Anthropic
    print("  OK - Librería importada")
except ImportError as e:
    print(f"  ERROR: {e}")
    print("  Ejecuta: pip install anthropic")
    exit(1)

# Test 2: Crear cliente
print("\n[2/3] Creando cliente...")
try:
    client = Anthropic(api_key=api_key)
    print("  OK - Cliente creado")
except Exception as e:
    print(f"  ERROR: {e}")
    exit(1)

# Test 3: Hacer una llamada simple
print("\n[3/3] Probando llamada a la API...")
try:
    message = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=50,
        messages=[
            {"role": "user", "content": "Di solo: funciona"}
        ]
    )

    response_text = message.content[0].text

    print("  OK - Llamada exitosa!")
    print(f"\n  Respuesta de Claude: {response_text}")
    print(f"\n  Tokens usados: {message.usage.input_tokens} in / {message.usage.output_tokens} out")

    print("\n" + "="*60)
    print("EXITO: Tu API key de Claude funciona correctamente")
    print("="*60)

except Exception as e:
    print(f"  ERROR: {e}")
    print("\n" + "="*60)
    print("PROBLEMA DETECTADO:")
    print("="*60)

    error_str = str(e)

    if "401" in error_str or "authentication" in error_str.lower():
        print("\nLa API key NO es válida.")
        print("\nSoluciones:")
        print("1. Ve a: https://console.anthropic.com/settings/keys")
        print("2. Crea una nueva API key")
        print("3. Cópiala en tu archivo .env")
    elif "rate" in error_str.lower() or "quota" in error_str.lower():
        print("\nHas excedido tu límite de uso.")
        print("Verifica tu cuenta en: https://console.anthropic.com/")
    else:
        print(f"\nError desconocido: {error_str}")

    print("\n" + "="*60)
