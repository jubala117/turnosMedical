# agentic_dev/tools/mysql_tool.py
"""
Herramientas para interactuar con MySQL de Medical&Care
"""
import mysql.connector
from mysql.connector import Error
import json
from typing import Annotated
from difflib import SequenceMatcher
import sys
import os

# Importar config
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import Config

def get_connection():
    """Obtiene conexión a MySQL"""
    try:
        conn = mysql.connector.connect(**Config.DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error conectando a MySQL: {e}")
        return None

def similitud(a: str, b: str) -> float:
    """Calcula similitud entre dos strings (0-1)"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def buscar_servicios_fuzzy(
    termino_busqueda: Annotated[str, "Término a buscar (ej: 'extracción dental')"]
) -> str:
    """
    Busca servicios en tipoServicio con búsqueda difusa.
    Útil cuando los nombres no coinciden exactamente.
    
    Args:
        termino_busqueda: Término a buscar
        
    Returns:
        JSON con resultados
    """
    conn = get_connection()
    if not conn:
        return json.dumps({
            "success": False,
            "error": "No se pudo conectar a la base de datos"
        })
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Búsqueda difusa: busca en descripción con LIKE
        query = """
            SELECT 
                idTipoServicio,
                descripcion,
                precioReferencial
            FROM tipoServicio
            WHERE descripcion LIKE %s
            OR descripcion LIKE %s
            LIMIT 20
        """
        
        # Patrones de búsqueda
        patron1 = f"%{termino_busqueda}%"
        patron2 = f"%{termino_busqueda.replace(' ', '%')}%"
        
        cursor.execute(query, (patron1, patron2))
        resultados = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return json.dumps({
            "success": True,
            "termino_buscado": termino_busqueda,
            "resultados": resultados,
            "total": len(resultados)
        }, default=str, ensure_ascii=False)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

def mapear_servicios_desde_lista(
    lista_servicios: Annotated[list, "Lista de nombres de servicios"]
) -> str:
    """
    Recibe lista de servicios y devuelve IDs encontrados.
    
    Args:
        lista_servicios: Lista de nombres ["Extracción dental", "Limpieza", ...]
        
    Returns:
        JSON con mapeo
    """
    conn = get_connection()
    if not conn:
        return json.dumps({
            "success": False,
            "error": "No se pudo conectar a la base de datos"
        })
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        mapeo = []
        no_encontrados = []
        
        for servicio in lista_servicios:
            # Búsqueda fuzzy para cada servicio
            query = """
                SELECT idTipoServicio, descripcion, precioReferencial
                FROM tipoServicio
                WHERE descripcion LIKE %s
                LIMIT 1
            """
            
            cursor.execute(query, (f"%{servicio}%",))
            resultado = cursor.fetchone()
            
            if resultado:
                mapeo.append({
                    "servicio_buscado": servicio,
                    "id": resultado['idTipoServicio'],
                    "nombre_bd": resultado['descripcion'],
                    "precio": float(resultado['precioReferencial'])
                })
            else:
                no_encontrados.append(servicio)
        
        cursor.close()
        conn.close()
        
        return json.dumps({
            "success": True,
            "encontrados": mapeo,
            "no_encontrados": no_encontrados,
            "total_encontrados": len(mapeo)
        }, default=str, ensure_ascii=False)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

def buscar_con_similitud(
    termino: Annotated[str, "Término a buscar"],
    umbral: Annotated[float, "Umbral de similitud (0.6 = 60%)"] = 0.6
) -> str:
    """
    Búsqueda avanzada con algoritmo de similitud.
    Encuentra el mejor match aunque no sea exacto.
    
    Args:
        termino: Término a buscar
        umbral: Umbral mínimo de similitud (default 0.6)
        
    Returns:
        JSON con mejores matches ordenados por similitud
    """
    conn = get_connection()
    if not conn:
        return json.dumps({
            "success": False,
            "error": "No se pudo conectar a la base de datos"
        })
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Obtener servicios potencialmente de odontología
        cursor.execute("""
            SELECT idTipoServicio, descripcion, precioReferencial 
            FROM tipoServicio
            WHERE descripcion LIKE '%dental%'
               OR descripcion LIKE '%odonto%'
               OR descripcion LIKE '%diente%'
               OR descripcion LIKE '%muela%'
               OR descripcion LIKE '%ortodoncia%'
               OR descripcion LIKE '%endodoncia%'
               OR descripcion LIKE '%blanqueamiento%'
               OR descripcion LIKE '%limpieza%'
               OR descripcion LIKE '%extraccion%'
               OR descripcion LIKE '%resina%'
        """)
        servicios_odonto = cursor.fetchall()
        
        # Calcular similitud para cada uno
        matches = []
        for servicio in servicios_odonto:
            sim = similitud(termino, servicio['descripcion'])
            if sim >= umbral:
                matches.append({
                    "id": servicio['idTipoServicio'],
                    "descripcion": servicio['descripcion'],
                    "precio": float(servicio['precioReferencial']),
                    "similitud": round(sim * 100, 2)
                })
        
        # Ordenar por similitud descendente
        matches.sort(key=lambda x: x['similitud'], reverse=True)
        
        cursor.close()
        conn.close()
        
        return json.dumps({
            "success": True,
            "termino": termino,
            "umbral_usado": umbral * 100,
            "mejores_matches": matches[:5],
            "total_encontrados": len(matches)
        }, default=str, ensure_ascii=False)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

def obtener_estructura_tabla(
    tabla: Annotated[str, "Nombre de la tabla"]
) -> str:
    """Obtiene estructura de una tabla"""
    conn = get_connection()
    if not conn:
        return json.dumps({
            "success": False,
            "error": "No se pudo conectar a la base de datos"
        })
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"DESCRIBE {tabla}")
        estructura = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return json.dumps({
            "success": True,
            "tabla": tabla,
            "columnas": estructura
        }, default=str)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

# Test del módulo
if __name__ == "__main__":
    print("🧪 Test de herramientas MySQL\n")
    
    # Test 1
    print("Test 1: Búsqueda fuzzy de 'dental'")
    resultado = buscar_servicios_fuzzy("dental")
    data = json.loads(resultado)
    if data['success']:
        print(f"✅ Encontrados: {data['total']} resultados")
    else:
        print(f"❌ Error: {data['error']}")
    
    print("\n" + "="*60 + "\n")
    
    # Test 2
    print("Test 2: Mapeo de servicios")
    servicios = ["Extracción", "Limpieza", "Ortodoncia"]
    resultado = mapear_servicios_desde_lista(servicios)
    data = json.loads(resultado)
    if data['success']:
        print(f"✅ Encontrados: {data['total_encontrados']}")
        print(f"❌ No encontrados: {len(data['no_encontrados'])}")
    else:
        print(f"❌ Error: {data['error']}")
    
    print("\n" + "="*60 + "\n")
    
    # Test 3
    print("Test 3: Búsqueda con similitud 'extraccion'")
    resultado = buscar_con_similitud("extraccion", 0.5)
    data = json.loads(resultado)
    if data['success']:
        print(f"✅ Mejores matches: {len(data['mejores_matches'])}")
        for match in data['mejores_matches'][:3]:
            print(f"  - {match['descripcion']} ({match['similitud']}%)")
    else:
        print(f"❌ Error: {data['error']}")