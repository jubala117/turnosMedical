# agentic_dev/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Keys
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    
    # MySQL
    DB_CONFIG = {
        "host": "127.0.0.1",
        "user": "root",
        "password": "",
        "database": "medicalcare"
    }
    
    # Rutas
    PROJECT_ROOT = "C:/xampp/htdocs/turnosMedical"
    
    # NUEVO: Configuración para AutoGen 0.10
    # Usa OpenAI-compatible config
    @staticmethod
    def get_claude_config():
        """Config para Claude en formato AutoGen 0.10"""
        return {
            "config_list": [
                {
                    "model": "claude-sonnet-4-5",
                    "api_key": Config.ANTHROPIC_API_KEY,
                    "base_url": "https://api.anthropic.com/v1",
                    "api_type": "anthropic",
                }
            ],
            "temperature": 0.7,
        }
    
    @staticmethod
    def get_deepseek_config():
        """Config para DeepSeek en formato AutoGen 0.10"""
        return {
            "config_list": [
                {
                    "model": "deepseek-chat",
                    "api_key": Config.DEEPSEEK_API_KEY,
                    "base_url": "https://api.deepseek.com",
                    "api_type": "openai",
                }
            ],
            "temperature": 0.5,
        }