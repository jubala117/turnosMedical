# agentic_dev/mapeo_autonomo.py
"""
Script para mapeo completamente autónomo usando el agente sin interacción
"""

import asyncio
import json
import sys
import os

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(__file__))

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.ui import Console
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.models.openai import OpenAIChatCompletionClient

from config import Config
from agents.odontologia_mapper import crear_agente_mapeador_odontologia, procesar_archivo_odontologia

async def ejecutar_agente_autonomo():
    """
    Ejecuta el agente completamente autónomo sin interacción
    """
    print("🤖 AGENTE AUTÓNOMO - MAPEO ODONTOLÓGICO")
    print("=" * 60)
    
    # Procesar archivo automáticamente para incluir datos en el mensaje
    print("📁 Procesando archivo automáticamente...")
    try:
        servicios = procesar_archivo_odontologia("servicios_odontologia.txt")
        print(f"✅ Servicios procesados: {len(servicios)}")
        
        # Crear datos estructurados para el agente
        datos_servicios = []
        for servicio in servicios:
            datos_servicios.append({
                "nombre": servicio["nombre"],
                "precio_particular": servicio["precio_particular"],
                "precio_club_medical": servicio["precio_club_medical"]
            })
        
    except Exception as e:
        print(f"❌ Error procesando archivo: {e}")
        return
    
    # Crear agente autónomo
    print("🤖 Creando agente autónomo...")
    agente = crear_agente_mapeador_odontologia()
    
    # Crear team (solo un agente)
    team = RoundRobinGroupChat([agente])
    
    # Mensaje completo con todos los datos
    mensaje = f"""
OBJETIVO: Mapear servicios odontológicos automáticamente

DATOS DEL ARCHIVO (ya procesados):
{json.dumps(datos_servicios, ensure_ascii=False, indent=2)}

TAREAS AUTÓNOMAS:
1. Usar las herramientas para buscar TODOS los servicios similares en la BD
2. Identificar patrones de descuento automáticamente
3. Generar mapeo PHP completo con formato:
   ```php
   $mapeo_odontologia = [
       'NOMBRE_SERVICIO' => [
           [ID_PARTICULAR, PRECIO_CLUB_MEDICAL],
           // más opciones si hay múltiples coincidencias
       ],
       // ...
   ];
   ```
4. Reportar discrepancias y servicios no encontrados
5. Guardar resultados automáticamente

HERRAMIENTAS DISPONIBLES:
- buscar_servicios_fuzzy() - Para búsqueda difusa
- buscar_con_similitud() - Para búsqueda con algoritmo de similitud
- analizar_patron_descuento() - Para analizar patrones de precios
- calcular_precio_club_medical() - Para calcular precios con descuento

INSTRUCCIÓN: Comienza inmediatamente el procesamiento automático. No preguntes, solo ejecuta.
"""
    
    print("🚀 Iniciando procesamiento autónomo...")
    print("   El agente trabajará automáticamente sin interacción")
    print("=" * 60)
    
    try:
        # Ejecutar el agente sin esperar interacción
        stream = team.run_stream(task=mensaje)
        await Console(stream)
        
        print("\n" + "=" * 60)
        print("✅ Procesamiento autónomo completado")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error en procesamiento autónomo: {e}")
        import traceback
        traceback.print_exc()

def ejecutar_mapeo_directo():
    """
    Ejecuta el mapeo directo sin agente (alternativa)
    """
    print("⚡ MAPEO DIRECTO - SIN AGENTE")
    print("=" * 60)
    
    from tools.mysql_tool import buscar_servicios_fuzzy
    from tools.price_analyzer import (
        analizar_patron_descuento, 
        calcular_precio_club_medical,
        encontrar_mejor_patron_global,
        comparar_precios_servicios
    )
    from agents.odontologia_mapper import (
        procesar_archivo_odontologia,
        generar_mapeo_final,
        generar_reporte_analisis
    )
    
    try:
        # 1. Procesar archivo
        print("📁 Procesando archivo...")
        servicios_archivo = procesar_archivo_odontologia("servicios_odontologia.txt")
        print(f"✅ Servicios procesados: {len(servicios_archivo)}")
        
        # 2. Buscar en BD
        print("🔎 Buscando servicios en BD...")
        servicios_bd = []
        terminos = ["dental", "odonto", "muela", "ortodoncia", "endodoncia", "blanqueamiento"]
        
        for termino in terminos:
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
        
        print(f"✅ Servicios únicos en BD: {len(servicios_bd_unicos)}")
        
        # 3. Comparar y generar mapeo
        print("🔄 Generando mapeo...")
        servicios_analizados = comparar_precios_servicios(servicios_archivo, servicios_bd_unicos)
        
        # 4. Generar archivos
        print("💾 Generando archivos...")
        
        # Convertir a formato de mapeo
        servicios_mapeados = []
        for servicio_analizado in servicios_analizados:
            mapeos = []
            for servicio_similar in servicio_analizado["servicios_similares_bd"]:
                patron = analizar_patron_descuento(
                    servicio_analizado["precio_archivo_particular"],
                    servicio_analizado["precio_archivo_club_medical"]
                )
                precio_club_medical = calcular_precio_club_medical(
                    servicio_similar["precio_bd"], patron
                )
                
                mapeos.append({
                    "id": servicio_similar["id"],
                    "nombre_bd": servicio_similar["nombre_bd"],
                    "precio_bd": servicio_similar["precio_bd"],
                    "precio_club_medical": precio_club_medical
                })
            
            servicios_mapeados.append({
                "servicio_archivo": servicio_analizado["servicio_archivo"],
                "mapeos": mapeos
            })
        
        # Generar archivo PHP
        codigo_php = generar_mapeo_final(servicios_mapeados)
        with open("mapeo_odontologia_empresa.php", "w", encoding="utf-8") as f:
            f.write(codigo_php)
        print("✅ Archivo PHP generado: mapeo_odontologia_empresa.php")
        
        # Generar reporte
        patron_global = encontrar_mejor_patron_global(servicios_archivo)
        reporte = generar_reporte_analisis(servicios_analizados, patron_global)
        with open("reporte_analisis_odontologia.txt", "w", encoding="utf-8") as f:
            f.write(reporte)
        print("✅ Reporte generado: reporte_analisis_odontologia.txt")
        
        print("\n🎉 MAPEO DIRECTO COMPLETADO!")
        
    except Exception as e:
        print(f"❌ Error en mapeo directo: {e}")
        import traceback
        traceback.print_exc()

def main():
    """
    Función principal
    """
    print("🏥 SISTEMA DE MAPEO ODONTOLÓGICO")
    print("=" * 60)
    print("1. Agente autónomo (con AutoGen)")
    print("2. Mapeo directo (sin agente)")
    print("=" * 60)
    
    opcion = input("Selecciona una opción (1-2): ").strip()
    
    if opcion == "1":
        asyncio.run(ejecutar_agente_autonomo())
    elif opcion == "2":
        ejecutar_mapeo_directo()
    else:
        print("❌ Opción no válida")

if __name__ == "__main__":
    main()
