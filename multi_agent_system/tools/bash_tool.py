"""
Herramienta para ejecutar comandos bash
"""
import subprocess
from typing import Dict, Any
from .base_tool import BaseTool


class BashTool(BaseTool):
    """Herramienta para ejecutar comandos bash"""

    def __init__(self):
        super().__init__(
            name="bash",
            description="Ejecuta un comando bash en el sistema. Retorna stdout y stderr."
        )

    def execute(self, command: str, timeout: int = 30, cwd: str = None) -> str:
        """
        Ejecuta un comando bash.

        Args:
            command: Comando a ejecutar
            timeout: Tiempo máximo de ejecución en segundos
            cwd: Directorio de trabajo (opcional)

        Returns:
            Output del comando
        """
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=cwd
            )

            output = []
            if result.stdout:
                output.append(f"STDOUT:\n{result.stdout}")
            if result.stderr:
                output.append(f"STDERR:\n{result.stderr}")

            output.append(f"\nExit code: {result.returncode}")

            return "\n".join(output) if output else "Comando ejecutado sin output"

        except subprocess.TimeoutExpired:
            return f"Error: El comando excedió el timeout de {timeout} segundos"
        except Exception as e:
            return f"Error al ejecutar comando: {str(e)}"

    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "Comando bash a ejecutar"
                },
                "timeout": {
                    "type": "integer",
                    "description": "Timeout en segundos (default: 30)",
                    "default": 30
                },
                "cwd": {
                    "type": "string",
                    "description": "Directorio de trabajo (opcional)"
                }
            },
            "required": ["command"]
        }
