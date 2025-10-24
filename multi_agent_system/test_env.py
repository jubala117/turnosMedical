import os
from dotenv import load_dotenv

print("="*60)
print("DEBUG: Verificando archivo .env")
print("="*60)

# Verificar que el archivo .env existe
env_file = ".env"
if os.path.exists(env_file):
    print(f"✅ Archivo .env encontrado en: {os.path.abspath(env_file)}")
else:
    print(f"❌ Archivo .env NO encontrado")
    print(f"   Buscando en: {os.path.abspath('.')}")

# Cargar el .env
load_dotenv()

# Leer las variables
anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
openai_key = os.getenv("OPENAI_API_KEY", "")

print("\n" + "="*60)
print("VALORES LEÍDOS:")
print("="*60)

# Mostrar info sin revelar la key completa
if anthropic_key:
    print(f"ANTHROPIC_API_KEY:")
    print(f"  - Longitud: {len(anthropic_key)} caracteres")
    print(f"  - Primeros 10: {anthropic_key[:10]}...")
    print(f"  - Últimos 10: ...{anthropic_key[-10:]}")
    print(f"  - Tiene espacios al inicio? {anthropic_key[0] == ' '}")
    print(f"  - Tiene espacios al final? {anthropic_key[-1] == ' '}")
    print(f"  - Tiene comillas? {'"' in anthropic_key or "'" in anthropic_key}")
    # Mostrar bytes para ver si hay caracteres raros
    print(f"  - Tipo: {type(anthropic_key)}")
else:
    print("❌ ANTHROPIC_API_KEY: NO CONFIGURADA")

if openai_key:
    print(f"\nOPENAI_API_KEY:")
    print(f"  - Longitud: {len(openai_key)} caracteres")
    print(f"  - Primeros 10: {openai_key[:10]}...")
else:
    print("\n⚠️ OPENAI_API_KEY: NO CONFIGURADA")

print("\n" + "="*60)
print("CONTENIDO DEL ARCHIVO .env:")
print("="*60)

# Leer el archivo .env directamente
try:
    with open('.env', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines, 1):
            # No mostrar la key completa, solo el formato
            if 'API_KEY' in line and '=' in line:
                key_name = line.split('=')[0]
                has_value = len(line.split('=')[1].strip()) > 0
                print(f"  Línea {i}: {key_name}= {'[tiene valor]' if has_value else '[VACÍO]'}")
            elif line.strip():
                print(f"  Línea {i}: {line.strip()[:30]}...")
except Exception as e:
    print(f"❌ Error leyendo .env: {e}")

print("\n" + "="*60)