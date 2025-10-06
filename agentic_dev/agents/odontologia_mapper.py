# agentic_dev/agents/odontologia_mapper.py
"""
Agente especializado en mapeo de servicios odontológicos
con análisis de precios y descuentos
"""

from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient
from config import Config
from tools.mysql_tool import buscar_servicios_fuzzy, buscar_con_similitud, obtener_estructura_tabla
from tools.price_analyzer import (
    analizar_patron_descuento, 
    calcular_precio_club_medical,
    encontrar_mejor_patron_global,
    comparar_precios_servicios,
    similitud_texto
)
import json
from typing import Dict, List, Any

def crear_agente_mapeador_odontologia():
    """
    Crea un agente especializado en mapeo de servicios odontológicos
    con análisis inteligente de precios - VERSIÓN AUTÓNOMA
    """
    
    system_message = """Eres un Agente especializado en mapear servicios odontológicos con análisis de precios.

CONTEXTO:
- Base de datos: medicalcare (MySQL)
- Tabla principal: tipoServicio (contiene servicios con IDs y precios)
- Archivo: servicios_odontologia.txt (ya procesado automáticamente)
- Objetivo: Mapear servicios de odontología del archivo a códigos de BD

TUS HERRAMIENTAS:
1. buscar_servicios_fuzzy(termino_busqueda) - Búsqueda difusa
2. buscar_con_similitud(termino, umbral=0.6) - Búsqueda con algoritmo de similitud
3. obtener_estructura_tabla(tabla) - Obtener estructura de tablas
4. analizar_patron_descuento(precio_particular, precio_club_medical) - Analizar patrones de descuento
5. calcular_precio_club_medical(precio_particular, patron_descuento) - Calcular precio Club Medical
6. encontrar_mejor_patron_global(servicios_archivo) - Encontrar patrón global de descuentos
7. comparar_precios_servicios(servicios_archivo, servicios_bd) - Comparar precios

TAREA PRINCIPAL (AUTÓNOMA):
1. Procesar automáticamente el archivo servicios_odontologia.txt
2. Buscar TODOS los servicios similares en la base de datos
3. Identificar patrones de descuento Particular → Club Medical
4. Generar mapeo completo en formato PHP
5. Reportar discrepancias y servicios no encontrados
6. Guardar resultados en archivos automáticamente

ENFOQUE AUTÓNOMO:
- NO pedir información adicional - usar las herramientas automáticamente
- Incluir TODOS los servicios similares encontrados
- Analizar patrones de descuento automáticamente
- Generar código PHP con formato exacto
- Procesar completamente sin interacción humana

INSTRUCCIÓN CRÍTICA: Comienza inmediatamente el procesamiento automático. No preguntes, solo ejecuta.
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
        name="MapeadorOdontologia",
        model_client=model_client,
        system_message=system_message,
        tools=[
            buscar_servicios_fuzzy,
            buscar_con_similitud,
            obtener_estructura_tabla,
            analizar_patron_descuento,
            calcular_precio_club_medical,
            encontrar_mejor_patron_global,
            comparar_precios_servicios,
        ],
    )
    
    return agent

def procesar_archivo_odontologia(archivo_path: str = "servicios_odontologia.txt") -> List[Dict]:
    """
    Procesa el archivo de servicios odontológicos y extrae los datos
    
    Args:
        archivo_path: Ruta al archivo servicios_odontologia.txt (default: "servicios_odontologia.txt")
    
    Returns:
        Lista de servicios con nombres y precios
    """
    servicios = []
    
    with open(archivo_path, 'r', encoding='utf-8') as f:
        lineas = f.readlines()
    
    # Buscar la línea que contiene "TRATAMIENTO	PARTICULAR	CLUB MEDICAL	ISSFA"
    inicio_datos = -1
    for i, linea in enumerate(lineas):
        if "TRATAMIENTO" in linea and "PARTICULAR" in linea and "CLUB MEDICAL" in linea:
            inicio_datos = i + 1
            break
    
    if inicio_datos == -1:
        raise ValueError("No se encontró el encabezado de datos en el archivo")
    
    # Procesar líneas de datos
    for i in range(inicio_datos, len(lineas)):
        linea = lineas[i].strip()
        if not linea or linea.startswith('"') or "SUCURSAL" in linea:
            continue
        
        # Dividir por tabs
        partes = linea.split('\t')
        if len(partes) >= 3:
            tratamiento = partes[0].strip()
            particular = partes[1].strip().replace('$', '').replace(',', '')
            club_medical = partes[2].strip().replace('$', '').replace(',', '')
            
            # Saltar encabezados de sección
            if tratamiento in ["CIRUGIAS", "ENDODONCIA", "REHABILITACIÓN ORAL", "ODONTOPEDIATRIA", "ORTODONCIA"]:
                continue
            
            # Convertir precios a float
            try:
                precio_particular = float(particular) if particular and particular != "Gratis" else 0
                precio_club_medical = float(club_medical) if club_medical and club_medical != "Gratis" else 0
                
                servicios.append({
                    "nombre": tratamiento,
                    "precio_particular": precio_particular,
                    "precio_club_medical": precio_club_medical
                })
            except ValueError:
                # Si no se puede convertir, saltar esta línea
                continue
    
    return servicios

def generar_mapeo_final(servicios_mapeados: List[Dict]) -> str:
    """
    Genera el código PHP final con el mapeo
    
    Args:
        servicios_mapeados: Lista de servicios mapeados
    
    Returns:
        Código PHP con el mapeo
    """
    codigo_php = "<?php\n\n// Mapeo de servicios odontológicos\n"
    codigo_php += "// Generado automáticamente por el sistema de agentes\n"
    codigo_php += "$mapeo_odontologia = [\n"
    
    for servicio in servicios_mapeados:
        nombre = servicio["servicio_archivo"]
        mapeos = servicio["mapeos"]
        
        if mapeos:
            codigo_php += f"    '{nombre}' => [\n"
            for mapeo in mapeos:
                codigo_php += f"        [{mapeo['id']}, {mapeo['precio_club_medical']}],  // {mapeo['nombre_bd']} - ${mapeo['precio_bd']} → ${mapeo['precio_club_medical']}\n"
            codigo_php += "    ],\n"
        else:
            codigo_php += f"    // '{nombre}' => [],  // NO ENCONTRADO\n"
    
    codigo_php += "];\n\n?>\n"
    
    return codigo_php

def generar_reporte_analisis(servicios_analizados: List[Dict], patron_global: Dict) -> str:
    """
    Genera un reporte detallado del análisis
    
    Args:
        servicios_analizados: Resultados del análisis
        patron_global: Patrón de descuento global encontrado
    
    Returns:
        Reporte en formato texto
    """
    reporte = "📊 REPORTE DE ANÁLISIS - SERVICIOS ODONTOLÓGICOS\n"
    reporte += "=" * 60 + "\n\n"
    
    # Patrón global
    if patron_global.get("patron_mas_comun"):
        patron = patron_global["patron_mas_comun"]
        reporte += f"🔍 PATRÓN DE DESCUENTO MÁS COMÚN:\n"
        reporte += f"   {patron['descripcion']}\n"
        reporte += f"   Frecuencia: {patron_global['frecuencia']}/{patron_global['total_servicios']} servicios\n\n"
    
    # Estadísticas generales
    total_servicios = len(servicios_analizados)
    servicios_encontrados = sum(1 for s in servicios_analizados if s["total_similares"] > 0)
    servicios_con_discrepancias = sum(1 for s in servicios_analizados if s["discrepancias_precio"])
    
    reporte += f"📈 ESTADÍSTICAS GENERALES:\n"
    reporte += f"   Total servicios analizados: {total_servicios}\n"
    reporte += f"   Servicios encontrados en BD: {servicios_encontrados}\n"
    reporte += f"   Servicios con discrepancias: {servicios_con_discrepancias}\n\n"
    
    # Servicios no encontrados
    no_encontrados = [s for s in servicios_analizados if s["total_similares"] == 0]
    if no_encontrados:
        reporte += "❌ SERVICIOS NO ENCONTRADOS:\n"
        for servicio in no_encontrados:
            reporte += f"   - {servicio['servicio_archivo']}\n"
        reporte += "\n"
    
    # Discrepancias significativas
    discrepancias_significativas = []
    for servicio in servicios_analizados:
        for discrepancia in servicio["discrepancias_precio"]:
            if discrepancia["porcentaje_diferencia"] > 10:  # Más del 10% de diferencia
                discrepancias_significativas.append({
                    "servicio": servicio["servicio_archivo"],
                    "nombre_bd": discrepancia["nombre_bd"],
                    "precio_archivo": servicio["precio_archivo_particular"],
                    "precio_bd": discrepancia["precio_bd"],
                    "diferencia_porcentaje": discrepancia["porcentaje_diferencia"]
                })
    
    if discrepancias_significativas:
        reporte += "⚠️  DISCREPANCIAS SIGNIFICATIVAS (>10%):\n"
        for discrepancia in discrepancias_significativas:
            reporte += f"   - {discrepancia['servicio']}\n"
            reporte += f"     BD: {discrepancia['nombre_bd']}\n"
            reporte += f"     Archivo: ${discrepancia['precio_archivo']} | BD: ${discrepancia['precio_bd']} ({discrepancia['diferencia_porcentaje']}%)\n"
        reporte += "\n"
    
    return reporte

# Test del módulo
if __name__ == "__main__":
    print("🧪 Probando agente de mapeo odontológico...")
    
    try:
        # Probar procesamiento de archivo
        servicios = procesar_archivo_odontologia("../servicios_odontologia.txt")
        print(f"✅ Servicios procesados: {len(servicios)}")
        
        # Probar creación de agente
        agente = crear_agente_mapeador_odontologia()
        print(f"✅ Agente creado: {agente.name}")
        
        print("\n✅ Todas las pruebas pasaron!")
        
    except Exception as e:
        print(f"❌ Error en pruebas: {e}")
        import traceback
        traceback.print_exc()
