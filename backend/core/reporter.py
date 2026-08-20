import csv
import json
import io
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.models import Investigation, Indicator, Evidence

def compile_json_report(db: Session, investigation_id: str) -> Dict[str, Any]:
    """
    Compiles a complete case file into a structured JSON report format.
    """
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        return {"error": "Investigation not found"}

    indicators = db.query(Indicator).filter(Indicator.investigation_id == investigation_id).all()
    evidence = db.query(Evidence).filter(Evidence.investigation_id == investigation_id).all()

    report = {
        "report_metadata": {
            "generated_at": "2026-08-20T10:35:00Z",
            "format": "JSON-v1",
            "scope": "Authorized Incident Reponse / Threat Intelligence Export"
        },
        "case_details": {
            "id": investigation.id,
            "title": investigation.title,
            "description": investigation.description,
            "severity": investigation.severity,
            "status": investigation.status,
            "assigned_analyst": investigation.assigned_analyst,
            "created_date": investigation.created_date.isoformat() if investigation.created_date else None,
            "last_updated": investigation.last_updated.isoformat() if investigation.last_updated else None,
            "notes": investigation.notes,
            "tags": investigation.tags
        },
        "indicators": [
            {
                "id": ind.id,
                "value": ind.value,
                "type": ind.type,
                "risk_score": ind.risk_score,
                "confidence": ind.confidence,
                "severity": ind.severity,
                "first_seen": ind.first_seen.isoformat() if ind.first_seen else None,
                "last_seen": ind.last_seen.isoformat() if ind.last_seen else None,
                "details": ind.details,
                "watchlisted": ind.watchlisted,
                "watchlist_reason": ind.watchlist_reason
            }
            for ind in indicators
        ],
        "evidence_vault": [
            {
                "id": ev.id,
                "filename": ev.filename,
                "uploaded_by": ev.uploaded_by,
                "timestamp": ev.timestamp.isoformat() if ev.timestamp else None,
                "file_type": ev.file_type,
                "size_bytes": ev.size_bytes,
                "related_incident": ev.related_incident,
                "notes": ev.notes,
                "chain_of_custody": ev.chain_of_custody
            }
            for ev in evidence
        ]
    }
    return report

def compile_indicators_csv(db: Session, investigation_id: str) -> str:
    """
    Generates a RFC 4180 compliant CSV string containing all IOCs for the investigation.
    """
    indicators = db.query(Indicator).filter(Indicator.investigation_id == investigation_id).all()
    
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    
    # Write CSV Header
    writer.writerow([
        "Indicator Value", 
        "Type", 
        "Risk Score", 
        "Confidence Level", 
        "Severity", 
        "First Observed", 
        "Last Observed", 
        "Watchlisted Status", 
        "Watchlist Reason"
    ])
    
    for ind in indicators:
        writer.writerow([
            ind.value,
            ind.type,
            ind.risk_score,
            ind.confidence,
            ind.severity,
            ind.first_seen.isoformat() if ind.first_seen else "",
            ind.last_seen.isoformat() if ind.last_seen else "",
            "Yes" if ind.watchlisted else "No",
            ind.watchlist_reason or ""
        ])
        
    return output.getvalue()
