import pytest
from backend.core.ioc_extractor import extract_iocs
from backend.core.risk_engine import calculate_risk_score
from backend.core.intelligence import get_confidence_details
from backend.auth import RoleChecker, TokenData
from fastapi import HTTPException

# 1. Test IOC Extraction Regex Engine
def test_ioc_extractor_success():
    log_text = """
    Incident log at 2026-08-20.
    Inbound phishing text from +15553492048 to user@example.com.
    Clicked link http://secure-bank-login.net/verify pointing to malicious server at 185.220.101.4.
    File payload check MD5: 44007d4b47ebcb102047ebcd6c04f981.
    """
    results = extract_iocs(log_text)
    
    assert "+15553492048" in results["PHONE"]
    assert "user@example.com" in results["EMAIL"]
    assert "http://secure-bank-login.net/verify" in results["URL"]
    assert "secure-bank-login.net" in results["DOMAIN"]
    assert "185.220.101.4" in results["IP"]
    assert "44007d4b47ebcb102047ebcd6c04f981" in results["HASH"]

# 2. Test Transparent Risk Scoring Engine
def test_risk_scoring_matrix():
    # Test High Phishing & Proxy score
    high_factors = {
        "vpn_proxy_indicator": True,      # +5
        "phishing_indicator": True,        # +20
        "malicious_domain": True,          # +30
        "ip_abuse_reputation": True,       # +20
    }
    high_res = calculate_risk_score(high_factors)
    assert high_res["total_score"] == 75
    assert high_res["classification"] == "HIGH"
    
    # Test Critical Score
    critical_factors = {
        "vpn_proxy_indicator": True,      # +5
        "phishing_indicator": True,        # +20
        "malicious_domain": True,          # +30
        "ip_abuse_reputation": True,       # +20
        "phone_spam_reputation": True,     # +10
    }
    crit_res = calculate_risk_score(critical_factors)
    assert crit_res["total_score"] == 85
    assert crit_res["classification"] == "CRITICAL"
    
    # Test Low Score
    low_factors = {
        "vpn_proxy_indicator": True,      # +5
    }
    low_res = calculate_risk_score(low_factors)
    assert low_res["total_score"] == 5
    assert low_res["classification"] == "LOW"

# 3. Test Threat Intel Confidence Engine
def test_confidence_calculations():
    # Test confidence matching seed values
    ip_conf = get_confidence_details("IP", "185.220.101.4")
    assert ip_conf["score"] == 92
    assert "Tor exit list" in ip_conf["reasons"][0]
    
    # Test fallback baseline
    unknown_conf = get_confidence_details("DOMAIN", "random-domain-name.org")
    assert unknown_conf["score"] == 50

# 4. Test Role-Based Access Control (RBAC) Hierarchies
def test_rbac_hierarchy_permissions():
    checker = RoleChecker(allowed_roles=["Investigator"])
    
    # Admin (level 4) should pass for Investigator (level 2)
    admin_token = TokenData(username="admin_user", role="Admin")
    res_admin = checker(admin_token)
    assert res_admin.username == "admin_user"
    
    # Security Analyst (level 3) should pass
    analyst_token = TokenData(username="analyst_user", role="Security Analyst")
    res_analyst = checker(analyst_token)
    assert res_analyst.username == "analyst_user"
    
    # Viewer (level 1) should be blocked and raise HTTP 403
    viewer_token = TokenData(username="viewer_user", role="Viewer")
    with pytest.raises(HTTPException) as exc_info:
        checker(viewer_token)
    assert exc_info.value.status_code == 403
