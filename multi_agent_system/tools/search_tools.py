"""
Herramientas para búsqueda de archivos y contenido
"""
import os
import re
import glob as glob_module
from typing import Dict, Any, List
from .base_tool import BaseTool


class GrepTool(BaseTool):
    """Herramienta para buscar patrones en archivos"""

    def __init__(self):
        super().__init__(
            name="grep",
            description="Busca un patrón (regex) en archivos. Similar a grep de Unix."
        )

    def execute(
        self,
        pattern: str,
        path: str = ".",
        file_pattern: str = "*",
        case_sensitive: bool = True,
        max_results: int = 100
    ) -> str:
        """
        Busca un patrón en archivos.

        Args:
            pattern: Patrón regex a buscar
            path: Directorio donde buscar
            file_pattern: Patrón de archivos a incluir (ej: "*.py")
            case_sensitive: Búsqueda sensible a mayúsculas
            max_results: Máximo número de resultados

        Returns:
            Resultados de la búsqueda
        """
        try:
            flags = 0 if case_sensitive else re.IGNORECASE
            regex = re.compile(pattern, flags)

            results = []
            count = 0

            # Buscar archivos
            search_pattern = os.path.join(path, "**", file_pattern)
            for file_path in glob_module.glob(search_pattern, recursive=True):
                if not os.path.isfile(file_path):
                    continue

                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        for line_num, line in enumerate(f, 1):
                            if regex.search(line):
                                results.append(f"{file_path}:{line_num}: {line.rstrip()}")
                                count += 1
                                if count >= max_results:
                                    break
                except:
                    continue

                if count >= max_results:
                    break

            if not results:
                return f"No se encontraron coincidencias para '{pattern}'"

            header = f"Encontradas {len(results)} coincidencias para '{pattern}':\n\n"
            return header + "\n".join(results)

        except Exception as e:
            return f"Error en búsqueda: {str(e)}"

    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "pattern": {
                    "type": "string",
                    "description": "Patrón regex a buscar"
                },
                "path": {
                    "type": "string",
                    "description": "Directorio donde buscar (default: .)",
                    "default": "."
                },
                "file_pattern": {
                    "type": "string",
                    "description": "Patrón de archivos (ej: *.py, *.js)",
                    "default": "*"
                },
                "case_sensitive": {
                    "type": "boolean",
                    "description": "Búsqueda sensible a mayúsculas",
                    "default": True
                },
                "max_results": {
                    "type": "integer",
                    "description": "Máximo número de resultados",
                    "default": 100
                }
            },
            "required": ["pattern"]
        }


class GlobTool(BaseTool):
    """Herramienta para buscar archivos por patrón"""

    def __init__(self):
        super().__init__(
            name="glob",
            description="Busca archivos que coincidan con un patrón. Ej: '**/*.py' encuentra todos los archivos Python."
        )

    def execute(self, pattern: str, path: str = ".", max_results: int = 100) -> str:
        """
        Busca archivos por patrón.

        Args:
            pattern: Patrón glob (ej: **/*.py)
            path: Directorio base
            max_results: Máximo número de resultados

        Returns:
            Lista de archivos encontrados
        """
        try:
            search_pattern = os.path.join(path, pattern)
            files = glob_module.glob(search_pattern, recursive=True)

            # Filtrar solo archivos (no directorios)
            files = [f for f in files if os.path.isfile(f)]

            if not files:
                return f"No se encontraron archivos que coincidan con '{pattern}'"

            # Limitar resultados
            files = files[:max_results]

            header = f"Encontrados {len(files)} archivo(s) que coinciden con '{pattern}':\n\n"
            file_list = "\n".join(sorted(files))

            return header + file_list

        except Exception as e:
            return f"Error en búsqueda: {str(e)}"

    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "pattern": {
                    "type": "string",
                    "description": "Patrón glob (ej: **/*.py, src/**/*.js)"
                },
                "path": {
                    "type": "string",
                    "description": "Directorio base (default: .)",
                    "default": "."
                },
                "max_results": {
                    "type": "integer",
                    "description": "Máximo número de resultados",
                    "default": 100
                }
            },
            "required": ["pattern"]
        }


class FindFileTool(BaseTool):
    """Herramienta para buscar archivos por nombre"""

    def __init__(self):
        super().__init__(
            name="find_file",
            description="Busca archivos por nombre en un directorio (recursivo)"
        )

    def execute(self, filename: str, path: str = ".", max_results: int = 50) -> str:
        """
        Busca archivos por nombre.

        Args:
            filename: Nombre del archivo a buscar (puede usar * como wildcard)
            path: Directorio donde buscar
            max_results: Máximo número de resultados

        Returns:
            Lista de archivos encontrados
        """
        try:
            results = []

            for root, dirs, files in os.walk(path):
                for file in files:
                    if self._match_pattern(file, filename):
                        full_path = os.path.join(root, file)
                        results.append(full_path)
                        if len(results) >= max_results:
                            break
                if len(results) >= max_results:
                    break

            if not results:
                return f"No se encontraron archivos con nombre '{filename}'"

            header = f"Encontrados {len(results)} archivo(s) con nombre '{filename}':\n\n"
            return header + "\n".join(sorted(results))

        except Exception as e:
            return f"Error en búsqueda: {str(e)}"

    def _match_pattern(self, filename: str, pattern: str) -> bool:
        """Compara nombre de archivo con patrón (soporta *)"""
        if '*' in pattern:
            regex_pattern = pattern.replace('*', '.*')
            return bool(re.match(regex_pattern, filename))
        else:
            return filename == pattern

    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Nombre del archivo a buscar (puede usar * como wildcard)"
                },
                "path": {
                    "type": "string",
                    "description": "Directorio donde buscar (default: .)",
                    "default": "."
                },
                "max_results": {
                    "type": "integer",
                    "description": "Máximo número de resultados",
                    "default": 50
                }
            },
            "required": ["filename"]
        }
