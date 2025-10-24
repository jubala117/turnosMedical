#!/usr/bin/env python3
import os
from pathlib import Path
from dotenv import load_dotenv

# Leer el archivo directamente
env_path = Path(__file__).parent / '.env'
print(f"Ruta del archivo: {env_path}")
print(f"¿Existe el archivo? {env_path.exists()}")
print("\nContenido del archivo:")
print("="*60)
with open(env_path, 'r', encoding='utf-8') as f:
    content = f.read()
    print(content)
print("="*60)

# Ahora cargar con dotenv
load_dotenv(env_path)
api_key = os.getenv("ANTHROPIC_API_KEY")
print(f"\nAPI Key leída por dotenv: {api_key[:20] if api_key else 'None'}...{api_key[-15:] if api_key else ''}")
print(f"Longitud: {len(api_key) if api_key else 0}")
