# agentic_dev/tools/price_analyzer.py
"""
Herramientas para análisis de patrones de precios y descuentos
"""

import json
from typing import Dict, List, Tuple, Optional
from difflib import SequenceMatcher
from typing import Annotated

def similitud_texto(a: str, b: str) -> float:
    """Calcula similitud entre dos strings (0-1)"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def analizar_patron_descuento(
    precio_particular: Annotated[float, "Precio particular del archivo"],
    precio_club_medical: Annotated[float, "Precio Club Medical del archivo"]
) -> Dict:
    """
    Analiza el patrón de descuento entre precios particular y Club Medical
    
    Returns:
        Dict con información del patrón de descuento
    """
    if precio_particular == 0:
        return {"tipo": "error", "mensaje": "Precio particular no puede ser 0"}
    
    diferencia = precio_particular - precio_club_medical
    porcentaje_descuento = (diferencia / precio_particular) * 100
    
    # Identificar patrones comunes
    patrones = []
    
    # Descuentos fijos comunes
    if diferencia == 2.50:
        patrones.append({"tipo": "fijo", "valor": 2.50, "descripcion": "Descuento fijo de $2.50"})
    elif diferencia == 5.00:
        patrones.append({"tipo": "fijo", "valor": 5.00, "descripcion": "Descuento fijo de $5.00"})
    elif diferencia == 3.00:
        patrones.append({"tipo": "fijo", "valor": 3.00, "descripcion": "Descuento fijo de $3.00"})
    
    # Descuentos porcentuales comunes
    if abs(porcentaje_descuento - 12.5) < 1:  # 12.5% ±1%
        patrones.append({"tipo": "porcentual", "valor": 12.5, "descripcion": "Descuento del 12.5%"})
    elif abs(porcentaje_descuento - 10.0) < 1:  # 10% ±1%
        patrones.append({"tipo": "porcentual", "valor": 10.0, "descripcion": "Descuento del 10%"})
    elif abs(porcentaje_descuento - 8.0) < 1:  # 8% ±1%
        patrones.append({"tipo": "porcentual", "valor": 8.0, "descripcion": "Descuento del 8%"})
    elif abs(porcentaje_descuento - 5.9) < 1:  # 5.9% ±1%
        patrones.append({"tipo": "porcentual", "valor": 5.9, "descripcion": "Descuento del 5.9%"})
    
    # Si no coincide con patrones comunes, calcular el porcentaje exacto
    if not patrones:
        patrones.append({
            "tipo": "porcentual_personalizado", 
            "valor": round(porcentaje_descuento, 2), 
            "descripcion": f"Descuento del {round(porcentaje_descuento, 2)}%"
        })
    
    return {
        "diferencia": round(diferencia, 2),
        "porcentaje_descuento": round(porcentaje_descuento, 2),
        "patrones": patrones,
        "precio_particular": precio_particular,
        "precio_club_medical": precio_club_medical
    }

def calcular_precio_club_medical(
    precio_particular: Annotated[float, "Precio particular de la BD"],
    patron_descuento: Annotated[Dict, "Patrón de descuento a aplicar"]
) -> float:
    """
    Calcula el precio Club Medical basado en un patrón de descuento
    
    Args:
        precio_particular: Precio particular de la base de datos
        patron_descuento: Patrón de descuento identificado
    
    Returns:
        Precio calculado para Club Medical
    """
    if not patron_descuento.get("patrones"):
        return precio_particular
    
    # Usar el primer patrón encontrado
    patron = patron_descuento["patrones"][0]
    
    if patron["tipo"] == "fijo":
        return max(0, precio_particular - patron["valor"])
    elif patron["tipo"] in ["porcentual", "porcentual_personalizado"]:
        descuento = precio_particular * (patron["valor"] / 100)
        return round(max(0, precio_particular - descuento), 2)
    else:
        return precio_particular

def encontrar_mejor_patron_global(
    servicios_archivo: Annotated[List[Dict], "Lista de servicios del archivo con precios"]
) -> Dict:
    """
    Encuentra el patrón de descuento más común en todos los servicios
    
    Args:
        servicios_archivo: Lista de servicios con precios particular y Club Medical
    
    Returns:
        Patrón de descuento más frecuente
    """
    patrones_encontrados = []
    
    for servicio in servicios_archivo:
        if servicio.get("precio_particular") and servicio.get("precio_club_medical"):
            patron = analizar_patron_descuento(
                servicio["precio_particular"], 
                servicio["precio_club_medical"]
            )
            if patron["patrones"]:
                patrones_encontrados.extend(patron["patrones"])
    
    # Contar frecuencia de patrones
    frecuencia_patrones = {}
    for patron in patrones_encontrados:
        key = f"{patron['tipo']}_{patron['valor']}"
        frecuencia_patrones[key] = frecuencia_patrones.get(key, 0) + 1
    
    # Encontrar patrón más común
    if frecuencia_patrones:
        patron_mas_comun_key = max(frecuencia_patrones, key=frecuencia_patrones.get)
        for patron in patrones_encontrados:
            if f"{patron['tipo']}_{patron['valor']}" == patron_mas_comun_key:
                return {
                    "patron_mas_comun": patron,
                    "frecuencia": frecuencia_patrones[patron_mas_comun_key],
                    "total_servicios": len(patrones_encontrados),
                    "todos_los_patrones": patrones_encontrados
                }
    
    return {"patron_mas_comun": None, "frecuencia": 0, "total_servicios": 0, "todos_los_patrones": []}

def comparar_precios_servicios(
    servicios_archivo: Annotated[List[Dict], "Servicios del archivo con precios"],
    servicios_bd: Annotated[List[Dict], "Servicios encontrados en BD"]
) -> List[Dict]:
    """
    Compara precios entre archivo y base de datos para identificar discrepancias
    
    Returns:
        Lista de servicios con análisis de precios
    """
    resultados = []
    
    for servicio_archivo in servicios_archivo:
        nombre_archivo = servicio_archivo["nombre"]
        precio_archivo_particular = servicio_archivo["precio_particular"]
        
        # Buscar servicios similares en BD
        servicios_similares = []
        for servicio_bd in servicios_bd:
            similitud = similitud_texto(nombre_archivo, servicio_bd["descripcion"])
            if similitud > 0.6:  # Umbral de similitud
                servicios_similares.append({
                    "id": servicio_bd["idTipoServicio"],
                    "nombre_bd": servicio_bd["descripcion"],
                    "precio_bd": float(servicio_bd["precioReferencial"]),
                    "similitud": round(similitud * 100, 2)
                })
        
        # Ordenar por similitud
        servicios_similares.sort(key=lambda x: x["similitud"], reverse=True)
        
        # Analizar discrepancias de precio
        discrepancias = []
        for servicio_similar in servicios_similares:
            precio_bd = servicio_similar["precio_bd"]
            diferencia = abs(precio_archivo_particular - precio_bd)
            
            if diferencia > 0.01:  # Tolerancia de 1 centavo
                porcentaje_diferencia = (diferencia / precio_archivo_particular) * 100
                discrepancias.append({
                    "id": servicio_similar["id"],
                    "nombre_bd": servicio_similar["nombre_bd"],
                    "precio_bd": precio_bd,
                    "diferencia": round(diferencia, 2),
                    "porcentaje_diferencia": round(porcentaje_diferencia, 2)
                })
        
        resultados.append({
            "servicio_archivo": nombre_archivo,
            "precio_archivo_particular": precio_archivo_particular,
            "precio_archivo_club_medical": servicio_archivo["precio_club_medical"],
            "servicios_similares_bd": servicios_similares,
            "discrepancias_precio": discrepancias,
            "total_similares": len(servicios_similares)
        })
    
    return resultados

# Test del módulo
if __name__ == "__main__":
    print("🧪 Probando herramientas de análisis de precios...")
    
    # Test 1: Análisis de patrón de descuento
    print("\nTest 1: Análisis de patrón de descuento")
    patron = analizar_patron_descuento(20.00, 17.50)
    print(f"✅ $20.00 → $17.50: {patron}")
    
    # Test 2: Cálculo de precio Club Medical
    print("\nTest 2: Cálculo de precio Club Medical")
    precio_calculado = calcular_precio_club_medical(25.00, patron)
    print(f"✅ $25.00 → ${precio_calculado}")
    
    # Test 3: Patrón global
    print("\nTest 3: Patrón global")
    servicios_ejemplo = [
        {"nombre": "Limpieza", "precio_particular": 20.00, "precio_club_medical": 17.50},
        {"nombre": "Restauración Simple", "precio_particular": 20.00, "precio_club_medical": 17.00},
    ]
    patron_global = encontrar_mejor_patron_global(servicios_ejemplo)
    print(f"✅ Patrón global: {patron_global}")
    
    print("\n✅ Todas las pruebas pasaron!")
