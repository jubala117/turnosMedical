#!/bin/bash

# Multi-Agent System - Setup Script
# Este script configura el entorno para usar el sistema

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           🤖 Multi-Agent System Setup                    ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Verificar Python
echo "🔍 Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 no está instalado"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✅ $PYTHON_VERSION encontrado"
echo ""

# Crear entorno virtual (opcional)
echo "🐍 ¿Deseas crear un entorno virtual? (recomendado) [s/n]"
read -r CREATE_VENV

if [ "$CREATE_VENV" = "s" ] || [ "$CREATE_VENV" = "S" ]; then
    echo "Creando entorno virtual..."
    python3 -m venv venv
    echo "✅ Entorno virtual creado"
    echo ""
    echo "Para activarlo:"
    echo "  Linux/Mac: source venv/bin/activate"
    echo "  Windows: venv\\Scripts\\activate"
    echo ""
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi
echo ""

# Configurar .env
if [ ! -f ".env" ]; then
    echo "📝 Configurando archivo .env..."
    cp .env.example .env
    echo "✅ Archivo .env creado"
    echo ""
    echo "⚠️  IMPORTANTE: Edita el archivo .env y agrega tus API keys"
    echo ""
else
    echo "ℹ️  Archivo .env ya existe"
    echo ""
fi

# Resumen
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    SETUP COMPLETADO                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Edita el archivo .env y agrega tus API keys:"
echo "   nano .env"
echo ""
echo "2. Ejecuta el quickstart para probar el sistema:"
echo "   python quickstart.py"
echo ""
echo "3. O ejecuta los ejemplos:"
echo "   python examples/basic_usage.py"
echo "   python examples/advanced_usage.py"
echo ""
echo "4. Lee el README.md para más información:"
echo "   cat README.md"
echo ""
echo "✅ ¡Todo listo para empezar!"
echo ""
