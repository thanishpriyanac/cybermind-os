import re
import json
from typing import List
from .registry import registry

def cve_lookup(cve_id: str) -> str:
    """Mock implementation for CVE Lookup."""
    # In a real app, this would query NVD API
    if not cve_id.upper().startswith("CVE-"):
        return f"Invalid CVE ID format: {cve_id}"
    return json.dumps({
        "id": cve_id,
        "description": f"Simulated details for {cve_id}. A vulnerability exists that allows remote code execution.",
        "cvss_score": 9.8,
        "severity": "CRITICAL",
        "references": ["https://nvd.nist.gov/vuln/detail/" + cve_id]
    })

def firewall_analyzer(logs: str) -> str:
    """Analyzes firewall logs to extract blocks and anomalies."""
    blocks = len(re.findall(r"block|drop|deny", logs, re.IGNORECASE))
    ips = list(set(re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", logs)))
    return json.dumps({
        "status": "Analyzed",
        "total_blocks_found": blocks,
        "unique_ips": ips,
        "recommendation": "Block malicious IPs at the edge." if blocks > 0 else "No suspicious activity detected."
    })

def log_analyzer(logs: str) -> str:
    """Analyzes generic server logs for anomalies."""
    errors = len(re.findall(r"error|fail|exception|fatal", logs, re.IGNORECASE))
    return json.dumps({
        "status": "Analyzed",
        "error_count": errors,
        "anomaly_level": "HIGH" if errors > 5 else "LOW",
        "summary": f"Found {errors} errors in the provided log extract."
    })

def sigma_generator(description: str) -> str:
    """Outputs a valid Sigma rule YAML based on a description."""
    title = description[:30].replace(" ", "_").lower()
    yaml = f"""
title: {title}
status: experimental
description: Auto-generated sigma rule for {description}
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains: 'suspicious_command'
  condition: selection
level: high
"""
    return yaml.strip()

def incident_summary(events: List[str]) -> str:
    """Provides an executive summary of an incident."""
    event_count = len(events)
    return json.dumps({
        "title": f"Incident Summary - {event_count} Events",
        "summary": f"An incident involving {event_count} key events occurred. Immediate investigation required.",
        "events_processed": events
    })

def ioc_analyzer(indicator: str) -> str:
    """Validates and classifies an IOC (IP, Domain, URL, Hash)."""
    classification = "Unknown"
    
    # Simple regex classification
    if re.match(r"^(?:\d{1,3}\.){3}\d{1,3}$", indicator):
        classification = "IPv4 Address"
    elif re.match(r"^[a-fA-F0-9]{32,64}$", indicator):
        classification = "File Hash (MD5/SHA1/SHA256)"
    elif "://" in indicator:
        classification = "URL"
    elif "." in indicator:
        classification = "Domain"
        
    return json.dumps({
        "indicator": indicator,
        "classification": classification,
        "reputation": "Suspicious", # Mock integration with VT/AbuseIPDB
        "recommendation": "Investigate surrounding network traffic."
    })

# Register Tools
registry.register(
    name="cve_lookup",
    description="Fetch details for a specific CVE ID.",
    input_schema={
        "type": "object",
        "properties": {
            "cve_id": {"type": "string", "description": "The CVE ID to lookup (e.g., CVE-2021-44228)"}
        },
        "required": ["cve_id"]
    },
    func=cve_lookup
)

registry.register(
    name="firewall_analyzer",
    description="Analyze a snippet of firewall logs for blocked connections and extracted IPs.",
    input_schema={
        "type": "object",
        "properties": {
            "logs": {"type": "string", "description": "The raw firewall log text"}
        },
        "required": ["logs"]
    },
    func=firewall_analyzer
)

registry.register(
    name="log_analyzer",
    description="Analyze generic server/system logs to detect errors and anomalies.",
    input_schema={
        "type": "object",
        "properties": {
            "logs": {"type": "string", "description": "The raw server log text"}
        },
        "required": ["logs"]
    },
    func=log_analyzer
)

registry.register(
    name="sigma_generator",
    description="Generate a Sigma rule YAML based on a natural language description of a threat.",
    input_schema={
        "type": "object",
        "properties": {
            "description": {"type": "string", "description": "Description of the behavior to detect"}
        },
        "required": ["description"]
    },
    func=sigma_generator
)

registry.register(
    name="incident_summary",
    description="Generate an executive summary from a list of chronological incident events.",
    input_schema={
        "type": "object",
        "properties": {
            "events": {
                "type": "array", 
                "items": {"type": "string"},
                "description": "List of events"
            }
        },
        "required": ["events"]
    },
    func=incident_summary
)

registry.register(
    name="ioc_analyzer",
    description="Validate, classify, and lookup reputation for an Indicator of Compromise (IP, Domain, URL, Hash).",
    input_schema={
        "type": "object",
        "properties": {
            "indicator": {"type": "string", "description": "The IOC to analyze (e.g. 8.8.8.8 or a sha256 hash)"}
        },
        "required": ["indicator"]
    },
    func=ioc_analyzer
)
