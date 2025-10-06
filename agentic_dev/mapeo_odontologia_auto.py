# agentic_dev/mapeo_odontologia_auto.py
"""
Script principal para mapeo automático de servicios odontológicos
Con análisis inteligente de precios y patrones de descuento
"""

import asyncio
import json
from pathlib import Path
import sys
import os

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(__file__))

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.ui import Console
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.models.openai import OpenAIChatCompletionClient

from config import Config
from tools.mysql_tool import buscar_servicios_fuzzy, buscar_con_similitud
from tools.price_analyzer import (
    analizar_patron_descuento, 
    calcular_precio_club_medical,
    encontrar_mejor_patron_global,
    comparar_precios_servicios
)
from agents.odontologia_mapper import (
    crear_agente_mapeador_odontologia,
    procesar_archivo_odontologia,
    generar_mapeo_final,
    generar_reporte_analisis
)

async def ejecutar_mapeo_automatico():
    """
    Ejecuta el mapeo automático completo de servicios odontológicos
    """
    print("🏥 SISTEMA DE MAPEO AUTOMÁTICO - ODONTOLOGÍA")
    print("=" * 60)
    
    # 1. Procesar archivo de entrada
    print("📁 Procesando archivo de servicios odontológicos...")
    try:
        servicios_archivo = procesar_archivo_odontologia("servicios_odontologia.txt")
        print(f"✅ Servicios procesados: {len(servicios_archivo)}")
    except Exception as e:
        print(f"❌ Error procesando archivo: {e}")
        return
    
    # 2. Analizar patrones de descuento
    print("\n🔍 Analizando patrones de descuento...")
    patron_global = encontrar_mejor_patron_global(servicios_archivo)
    if patron_global.get("patron_mas_comun"):
        patron = patron_global["patron_mas_comun"]
        print(f"✅ Patrón encontrado: {patron['descripcion']}")
        print(f"   Frecuencia: {patron_global['frecuencia']}/{patron_global['total_servicios']} servicios")
    else:
        print("⚠️  No se encontró un patrón de descuento claro")
    
    # 3. Buscar servicios en base de datos
    print("\n🔎 Buscando servicios en base de datos...")
    servicios_bd = []
    
    # Obtener todos los servicios de odontología de la BD
    resultado_busqueda = buscar_servicios_fuzzy("dental")
    data_busqueda = json.loads(resultado_busqueda)
    
    if data_busqueda["success"]:
        servicios_bd.extend(data_busqueda["resultados"])
        print(f"✅ Servicios dentales encontrados: {len(servicios_bd)}")
    
    # Buscar también servicios relacionados con odontología
    terminos_odontologia = ["odonto", "diente", "muela", "ortodoncia", "endodoncia", "blanqueamiento"]
    for termino in terminos_odontologia:
        resultado = buscar_servicios_fuzzy(termino)
        data = json.loads(resultado)
        if data["success"]:
            servicios_bd.extend(data["resultados"])
    
    # Eliminar duplicados
    servicios_bd_unicos = []
    ids_vistos = set()
    for servicio in servicios_bd:
        if servicio["idTipoServicio"] not in ids_vistos:
            servicios_bd_unicos.append(servicio)
            ids_vistos.add(servicio["idTipoServicio"])
    
    print(f"✅ Total servicios únicos en BD: {len(servicios_bd_unicos)}")
    
    # 4. Comparar precios y generar análisis
    print("\n📊 Comparando precios y generando análisis...")
    servicios_analizados = comparar_precios_servicios(servicios_archivo, servicios_bd_unicos)
    
    # 5. Generar mapeo final
    print("\n🔄 Generando mapeo final...")
    servicios_mapeados = []
    
    for servicio_analizado in servicios_analizados:
        mapeos = []
        
        for servicio_similar in servicio_analizado["servicios_similares_bd"]:
            # Calcular precio Club Medical basado en el patrón
            precio_club_medical_calculado = calcular_precio_club_medical(
                servicio_similar["precio_bd"],
                analizar_patron_descuento(
                    servicio_analizado["precio_archivo_particular"],
                    servicio_analizado["precio_archivo_club_medical"]
                )
            )
            
            mapeos.append({
                "id": servicio_similar["id"],
                "nombre_bd": servicio_similar["nombre_bd"],
                "precio_bd": servicio_similar["precio_bd"],
                "precio_club_medical": precio_club_medical_calculado,
                "similitud": servicio_similar["similitud"]
            })
        
        servicios_mapeados.append({
            "servicio_archivo": servicio_analizado["servicio_archivo"],
            "precio_archivo_particular": servicio_analizado["precio_archivo_particular"],
            "precio_archivo_club_medical": servicio_analizado["precio_archivo_club_medical"],
            "mapeos": mapeos
        })
    
    # 6. Generar archivos de salida
    print("\n💾 Generando archivos de salida...")
    
    # Generar código PHP
    codigo_php = generar_mapeo_final(servicios_mapeados)
    with open("mapeo_odontologia_empresa.php", "w", encoding="utf-8") as f:
        f.write(codigo_php)
    print("✅ Archivo PHP generado: mapeo_odontologia_empresa.php")
    
    # Generar reporte de análisis
    reporte = generar_reporte_analisis(servicios_analizados, patron_global)
    with open("reporte_analisis_odontologia.txt", "w", encoding="utf-8") as f:
        f.write(reporte)
    print("✅ Reporte de análisis generado: reporte_analisis_odontologia.txt")
    
    # 7. Mostrar resumen final
    print("\n" + "=" * 60)
    print("🎉 MAPEO AUTOMÁTICO COMPLETADO")
    print("=" * 60)
    
    total_servicios = len(servicios_mapeados)
    servicios_con_mapeo = sum(1 for s in servicios_mapeados if s["mapeos"])
    servicios_sin_mapeo = total_servicios - servicios_con_mapeo
    
    print(f"📊 RESUMEN FINAL:")
    print(f"   • Total servicios analizados: {total_servicios}")
    print(f"   • Servicios mapeados: {servicios_con_mapeo}")
    print(f"   • Servicios no encontrados: {servicios_sin_mapeo}")
    print(f"   • Archivo PHP generado: mapeo_odontologia_empresa.php")
    print(f"   • Reporte de análisis: reporte_analisis_odontologia.txt")
    
    if servicios_sin_mapeo > 0:
        print(f"\n⚠️  {servicios_sin_mapeo} servicios no se encontraron en la BD")
        print("   Revisa el reporte de análisis para más detalles")
    
    print("\n🔍 Para revisar el análisis detallado, consulta:")
    print("   - reporte_analisis_odontologia.txt")
    print("   - mapeo_odontologia_empresa.php")

def ejecutar_con_agente_inteligente():
    """
    Ejecuta el mapeo usando el agente inteligente de AutoGen
    """
    print("🤖 EJECUTANDO CON AGENTE INTELIGENTE")
    print("=" * 60)
    
    # Crear agente
    agente = crear_agente_mapeador_odontologia()
    
    # Crear team (solo un agente por ahora)
    team = RoundRobinGroupChat([agente])
    
    # Mensaje para el agente
    mensaje = """
OBJETIVO: Mapear servicios odontológicos del archivo servicios_odontologia.txt

TAREAS:
1. Analizar el archivo servicios_odontologia.txt
2. Buscar servicios similares en la base de datos medicalcare
3. Identificar patrones de descuento Particular → Club Medical
4. Generar mapeo en formato PHP similar a mapeo_exameneslab_empresa_Mod.txt
5. Reportar discrepancias y servicios no encontrados

FORMATO DE SALIDA ESPERADO:
```php
$mapeo_odontologia = [
    'NOMBRE_SERVICIO' => [
        [ID_PARTICULAR, PRECIO_CLUB_MEDICAL],
        // más opciones si hay múltiples coincidencias
    ],
    // ...
];
```

ENFOQUE:
- Incluir TODOS los servicios similares encontrados
- Usar herramientas de análisis de precios para calcular descuentos
- Reportar discrepancias significativas
- Mantener comentarios explicativos en el código

Comienza analizando el archivo y generando el mapeo completo.
"""
    
    print("🤖 Iniciando agente inteligente...")
    print("   Este proceso puede tomar algunos minutos...")
    print("=" * 60)
    
    try:
        stream = team.run_stream(task=mensaje)
        asyncio.run(Console(stream))
        
        print("\n" + "=" * 60)
        print("✅ Proceso con agente completado")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error en proceso con agente: {e}")
        import traceback
        traceback.print_exc()

def main():
    """
    Función principal con menú de opciones
    """
    print("🏥 SISTEMA DE MAPEO ODONTOLÓGICO - Medical&Care")
    print("=" * 60)
    print("1. Mapeo automático (rápido)")
    print("2. Mapeo con agente inteligente (más detallado)")
    print("3. Solo análisis de patrones de precios")
    print("=" * 60)
    
    opcion = input("Selecciona una opción (1-3): ").strip()
    
    if opcion == "1":
        asyncio.run(ejecutar_mapeo_automatico())
    elif opcion == "2":
        ejecutar_con_agente_inteligente()
    elif opcion == "3":
        # Solo análisis de patrones
        servicios = procesar_archivo_odontologia("../servicios_odontologia.txt")
        patron_global = encontrar_mejor_patron_global(servicios)
        reporte = generar_reporte_analisis([], patron_global)
        print(reporte)
    else:
        print("❌ Opción no válida")

if __name__ == "__main__":
    main()
