import os
import yaml
from typing import Dict, Any, Tuple

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "../../../packages/prompts")

class PromptEngine:
    @classmethod
    def load_prompt(cls, prompt_id: str) -> Tuple[Dict[str, Any], str]:
        """
        Loads a prompt by ID (filename without .md).
        Returns a tuple of (metadata_dict, content_string).
        """
        file_path = os.path.join(PROMPTS_DIR, f"{prompt_id}.md")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Prompt '{prompt_id}' not found.")
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        if content.startswith("---"):
            # Has frontmatter
            parts = content.split("---", 2)
            if len(parts) >= 3:
                frontmatter_raw = parts[1]
                body = parts[2].strip()
                metadata = yaml.safe_load(frontmatter_raw) or {}
                return metadata, body
                
        return {}, content.strip()
