from backend.core.ioc_extractor import extract_iocs

def test_extract_iocs():
    sample_text = (
        "Reported suspicious SMS received from +15553492048 pointing to "
        "https://secure-bank-login.net/verify resolving to IP 185.220.101.4."
    )
    extracted = extract_iocs(sample_text)
    assert "+15553492048" in extracted["PHONE"]
    assert "https://secure-bank-login.net/verify" in extracted["URL"]
    assert "185.220.101.4" in extracted["IP"]
    assert "secure-bank-login.net" in extracted["DOMAIN"]
