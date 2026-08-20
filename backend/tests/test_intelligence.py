from backend.core.intelligence import analyze_indicator, get_confidence_score

def test_analyze_indicator_ip():
    res = analyze_indicator("185.220.101.4", "IP")
    assert res["ip"] == "185.220.101.4"
    assert res["tor"] is True
    assert res["abuse_score"] == 85

def test_analyze_indicator_domain():
    res = analyze_indicator("secure-bank-login.net", "DOMAIN")
    assert res["domain"] == "secure-bank-login.net"
    assert res["age_days"] == 1
    assert "A" in res["dns_records"]

def test_get_confidence_score():
    details = {"abuse_score": 85, "location_confidence": "HIGH"}
    score = get_confidence_score("IP", details)
    assert score == 90
