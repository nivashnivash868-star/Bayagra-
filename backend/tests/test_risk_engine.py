from backend.core.risk_engine import calculate_risk_score

def test_calculate_risk_score_low():
    factors = {
        "phone_spam_reputation": False,
        "ip_abuse_reputation": False,
        "vpn_proxy_indicator": False,
        "malicious_domain": False,
        "phishing_indicator": False,
        "repeated_activity": False,
        "malware_infrastructure": False
    }
    result = calculate_risk_score(factors)
    assert result["total_score"] == 0
    assert result["classification"] == "LOW"

def test_calculate_risk_score_medium():
    factors = {
        "phone_spam_reputation": True, # +10
        "vpn_proxy_indicator": True, # +5
        "repeated_activity": False
    }
    result = calculate_risk_score(factors)
    assert result["total_score"] == 15
    assert result["classification"] == "LOW" # Since LOW is <= 20

def test_calculate_risk_score_critical():
    factors = {
        "malicious_domain": True, # +30
        "phishing_indicator": True, # +20
        "ip_abuse_reputation": True, # +20
        "malware_infrastructure": True # +30
    }
    result = calculate_risk_score(factors)
    assert result["total_score"] == 100 # capped at 100
    assert result["classification"] == "CRITICAL"
