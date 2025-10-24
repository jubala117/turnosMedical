"""
Herramientas para operaciones con archivos
"""
import os
from typing import Dict, Any
from .base_tool import BaseTool


class ReadFileTool(BaseTool):
    """Herramienta para leer archivos"""

    def __init__(self):
        super().__init__(
            name="read_file",
            description="Lee el contenido de un archivo. Retorna el contenido completo del archivo."
        )

    def execute(self, file_path: str, encoding: str = "utf-8") -> str:
        """Lee un archivo y retorna su contenido"""
        try:
            if not os.path.exists(file_path):
                return f"Error: El archivo '{file_path}' no existe"

            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read()

            return f"Contenido de {file_path}:\n\n{content}"
        except Exception as e:
            return f"Error al leer archivo: {str(e)}"

    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Ruta del archivo a leer"
                },
                "encoding": {
                    "type": "string",
                    "description": "Encoding del archivo (default: utf-8)",
                    "default": "utf-8"
                }
            },
            "required": ["file_path"]
        }


class WriteFileTool(BaseTool):
    """Herramienta para escribir archivos"""

    def __init__(self):
        super().__init__(
            name="write_file",
            description="Escribe contenido en un archivo. Crea el archivo si no existe, lo sobrescribe si existe."
        )

    def execute(self, file_path: str, content: str, encoding: str = "utf-8") -> str:
        """Escribe contenido en un archivo"""
        try:
            # Crear directorios si no existen
            directory = os.path.dirname(file_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory)

            with open(file_path, 'w', encoding=encoding) as f:
                f.write(content)

            return f"Archivo '{file_path}' escrito exitosamente ({len(content)} caracteres)"
        except Exception as e:
            return f"Error al escribir archivo: {str(e)}"

    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Ruta del archivo a escribir"
                },
                "content": {
                    "type": "string",
                    "description": "Contenido a escribir en el archivo"
                },
                "encoding": {
                    "type": "string",
                    "description": "Encoding del archivo (default: utf-8)",
                    "default": "utf-8"
                }
            },
            "required": ["file_path", "content"]
        }


class EditFileTool(BaseTool):
    """Herramienta para editar archivos (búsqueda y reemplazo)"""

    def __init__(self):
        super().__init__(
            name="edit_file",
            description="Edita un archivo reemplazando texto específico. Busca old_text y lo reemplaza con new_text."
        )

    def execute(self, file_path: str, old_text: str, new_text: str, encoding: str = "utf-8") -> str:
        """Edita un archivo reemplazando texto"""
        try:
            if not os.path.exists(file_path):
                return f"Error: El archivo '{file_path}' no existe"

            # Leer archivo
            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read()

            # Verificar que el texto exista
            if old_text not in content:
                return f"Error: No se encontró el texto a reemplazar en '{file_path}'"

            # Reemplazar
            new_content = content.replace(old_text, new_text)
            occurrences = content.count(old_text)

            # Escribir archivo
            with open(file_path, 'w', encoding=encoding) as f:
                f.write(new_content)

            return f"Archivo '{file_path}' editado exitosamente. {occurrences} ocurrencia(s) reemplazada(s)."
        except Exception as e:
            return f"Error al editar archivo: {str(e)}"

    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Ruta del archivo a editar"
                },
                "old_text": {
                    "type": "string",
                    "description": "Texto a buscar y reemplazar"
                },
                "new_text": {
                    "type": "string",
                    "description": "Texto nuevo con el que reemplazar"
                },
                "encoding": {
                    "type": "string",
                    "description": "Encoding del archivo (default: utf-8)",
                    "default": "utf-8"
                }
            },
            "required": ["file_path", "old_text", "new_text"]
        }


class ListDirectoryTool(BaseTool):
    """Herramienta para listar contenido de directorios"""

    def __init__(self):
        super().__init__(
            name="list_directory",
            description="Lista el contenido de un directorio"
        )

    def execute(self, directory_path: str = ".") -> str:
        """Lista el contenido de un directorio"""
        try:
            if not os.path.exists(directory_path):
                return f"Error: El directorio '{directory_path}' no existe"

            if not os.path.isdir(directory_path):
                return f"Error: '{directory_path}' no es un directorio"

            items = os.listdir(directory_path)
            result = [f"Contenido de '{directory_path}':\n"]

            for item in sorted(items):
                full_path = os.path.join(directory_path, item)
                if os.path.isdir(full_path):
                    result.append(f"  [DIR]  {item}/")
                else:
                    size = os.path.getsize(full_path)
                    result.append(f"  [FILE] {item} ({size} bytes)")

            return "\n".join(result)
        except Exception as e:
            return f"Error al listar directorio: {str(e)}"

    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "directory_path": {
                    "type": "string",
                    "description": "Ruta del directorio a listar (default: directorio actual)",
                    "default": "."
                }
            }
        }
