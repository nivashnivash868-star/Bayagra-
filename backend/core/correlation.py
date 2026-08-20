from sqlalchemy.orm import Session
from backend.models import Indicator, Investigation
from typing import List, Dict, Any

def find_correlated_investigations(db: Session, current_investigation_id: str, indicator_values: List[str]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Finds other investigations sharing any of the provided indicator values.
    Returns:
        Dict mapping indicator value to list of investigation metadata dictionaries.
    """
    correlations = {}
    
    if not indicator_values:
        return correlations

    for value in indicator_values:
        # Query indicators with matching value belonging to other cases
        matches = (
            db.query(Indicator)
            .join(Investigation)
            .filter(Indicator.value == value)
            .filter(Indicator.investigation_id != current_investigation_id)
            .all()
        )
        
        correlated_cases = []
        seen_case_ids = set()
        
        for m in matches:
            if m.investigation and m.investigation_id not in seen_case_ids:
                seen_case_ids.add(m.investigation_id)
                correlated_cases.append({
                    "investigation_id": m.investigation.id,
                    "title": m.investigation.title,
                    "severity": m.investigation.severity,
                    "status": m.investigation.status,
                    "analyst": m.investigation.assigned_analyst,
                    "created_date": m.investigation.created_date.isoformat()
                })
                
        if correlated_cases:
            correlations[value] = correlated_cases
            
    return correlations
