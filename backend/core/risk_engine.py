from typing import Dict, Any, List

def calculate_risk_score(factors: Dict[str, bool]) -> Dict[str, Any]:
    """
    Transparent scoring system based on:
    - Phone reputation: +10
    - IP reputation: +20
    - VPN/proxy indicator: +5
    - Known malicious domain: +30
    - Phishing indicator: +20
    - Repeated suspicious activity: +10
    - Known malware infrastructure: +30
    
    Returns:
        Dict containing total_score, classification, and matched_breakdown.
    """
    score = 0
    breakdown = []
    
    if factors.get("phone_spam_reputation", False):
        score += 10
        breakdown.append({"factor": "High-spam phone reputation", "increment": 10})
        
    if factors.get("ip_abuse_reputation", False):
        score += 20
        breakdown.append({"factor": "Host IP reputation flagged for abuse", "increment": 20})
        
    if factors.get("vpn_proxy_indicator", False):
        score += 5
        breakdown.append({"factor": "Anonymizing connection (VPN/Proxy/Tor)", "increment": 5})
        
    if factors.get("malicious_domain", False):
        score += 30
        breakdown.append({"factor": "Known malicious domain stem matched", "increment": 30})
        
    if factors.get("phishing_indicator", False):
        score += 20
        breakdown.append({"factor": "Text/URL contains phishing signatures", "increment": 20})
        
    if factors.get("repeated_activity", False):
        score += 10
        breakdown.append({"factor": "Repeated indicator occurrence in telemetry", "increment": 10})
        
    if factors.get("malware_infrastructure", False):
        score += 30
        breakdown.append({"factor": "Malware C2/distribution network indicator", "increment": 30})

    # Clamp score to a max of 100
    score = min(score, 100)
    
    # Classifications
    if score <= 20:
        classification = "LOW"
    elif score <= 50:
        classification = "MEDIUM"
    elif score <= 75:
        classification = "HIGH"
    else:
        classification = "CRITICAL"
        
    return {
        "score": score,
        "total_score": score,
        "classification": classification,
        "breakdown": breakdown,
        "matched_breakdown": breakdown
    }
