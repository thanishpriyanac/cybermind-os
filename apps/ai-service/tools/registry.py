from typing import Dict, Any, Callable, List

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Dict[str, Any]] = {}

    def register(self, name: str, description: str, input_schema: Dict[str, Any], func: Callable):
        self._tools[name] = {
            "name": name,
            "description": description,
            "input_schema": input_schema,
            "func": func
        }

    def unregister(self, name: str):
        if name in self._tools:
            del self._tools[name]

    def discover(self) -> List[Dict[str, Any]]:
        return list(self._tools.values())

    def execute(self, name: str, **kwargs) -> Any:
        if name not in self._tools:
            raise ValueError(f"Tool {name} not found in registry.")
        return self._tools[name]["func"](**kwargs)

# Global singleton instance
registry = ToolRegistry()
