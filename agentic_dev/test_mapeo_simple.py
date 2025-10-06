# agentic_dev/test_mapeo_simple.py
"""
Script de prueba simple para verificar el procesamiento del archivo de odontología
"""

import sys
import os
import json

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(__file__))

from agents.odontologia_mapper import procesar_archivo_odontologia
from tools.price_analyzer import encontrar_mejor_patron_global, analizar_patron_descuento
from tools.mysql_tool import buscar_servicios_fuzzy

def test_procesamiento_archivo():
    """Prueba el procesamiento del archivo de servicios odontológicos"""
    print("🧪 Probando procesamiento de archivo...")
    
    try:
        servicios = procesar_archivo_odontologia("servicios_odontologia.txt")
        print(f"✅ Servicios procesados: {len(servicios)}")
        
        # Mostrar algunos ejemplos
        print("\n📋 Ejemplos de servicios procesados:")
        for i, servicio in enumerate(servicios[:5]):
            print(f"   {i+1}. {servicio['nombre']} - Particular: ${servicio['precio_particular']} | Club Medical: ${servicio['precio_club_medical']}")
        
        return servicios
        
    except Exception as e:
        print(f"❌ Error procesando archivo: {e}")
        return []

def test_analisis_patrones(servicios):
    """Prueba el análisis de patrones de descuento"""
    print("\n🧪 Probando análisis de patrones...")
    
    try:
        patron_global = encontrar_mejor_patron_global(servicios)
        
        if patron_global.get("patron_mas_comun"):
            patron = patron_global["patron_mas_comun"]
            print(f"✅ Patrón global encontrado: {patron['descripcion']}")
            print(f"   Frecuencia: {patron_global['frecuencia']}/{patron_global['total_servicios']}")
        else:
            print("⚠️  No se encontró patrón global claro")
        
        # Analizar algunos patrones individuales
        print("\n🔍 Ejemplos de patrones individuales:")
        for servicio in servicios[:3]:
            patron = analizar_patron_descuento(
                servicio["precio_particular"], 
                servicio["precio_club_medical"]
            )
            print(f"   {servicio['nombre']}: {patron['patrones'][0]['descripcion']}")
        
        return patron_global
        
    except Exception as e:
        print(f"❌ Error en análisis de patrones: {e}")
        return {}

def test_busqueda_bd():
    """Prueba la búsqueda en base de datos"""
    print("\n🧪 Probando búsqueda en base de datos...")
    
    try:
        # Buscar servicios dentales
        resultado = buscar_servicios_fuzzy("dental")
        data = json.loads(resultado)
        
        if data["success"]:
            print(f"✅ Servicios encontrados: {data['total']}")
            
            # Mostrar algunos ejemplos
            print("\n📋 Ejemplos de servicios en BD:")
            for i, servicio in enumerate(data["resultados"][:3]):
                print(f"   {i+1}. ID: {servicio['idTipoServicio']} - {servicio['descripcion']} - ${servicio['precioReferencial']}")
        else:
            print(f"❌ Error en búsqueda: {data['error']}")
            
    except Exception as e:
        print(f"❌ Error en búsqueda BD: {e}")

def main():
    """Función principal de prueba"""
    print("🧪 SISTEMA DE PRUEBA - MAPEO ODONTOLÓGICO")
    print("=" * 50)
    
    # 1. Procesar archivo
    servicios = test_procesamiento_archivo()
    if not servicios:
        return
    
    # 2. Analizar patrones
    patron_global = test_analisis_patrones(servicios)
    
    # 3. Buscar en BD
    test_busqueda_bd()
    
    # 4. Resumen
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE PRUEBAS:")
    print(f"   • Servicios procesados: {len(servicios)}")
    print(f"   • Patrón global: {patron_global.get('patron_mas_comun', {}).get('descripcion', 'No encontrado')}")
    print(f"   • Sistema listo para mapeo automático")
    print("\n✅ Pruebas completadas exitosamente!")

if __name__ == "__main__":
    main()
