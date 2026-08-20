import re
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Static Intelligence Database for Mock Mode
MOCK_IPS = {
    "185.220.101.4": {
        "ip": "185.220.101.4",
        "isp": "Zwiebelfreunde e.V.",
        "org": "Tor Exit Node Network",
        "asn": "AS206334",
        "reverse_dns": "tor-exit.zwiebelfreunde.de",
        "country": "Germany",
        "region": "Saxony",
        "city": "Dresden",
        "timezone": "Europe/Berlin",
        "network_type": "Hosting / Tor",
        "hosting_provider": True,
        "datacenter": True,
        "vpn": False,
        "proxy": True,
        "tor": True,
        "abuse_score": 85,
        "threat_score": 85,
        "reasons": ["IP is currently marked as an active Tor exit node", "Associated with 4 credential harvesting reports in last 48 hours"],
        "location_confidence": "HIGH",
        "coordinates": [51.0504, 13.7373],
        "first_seen": "2026-01-10T12:00:00Z",
        "last_seen": "2026-08-20T10:20:00Z"
    },
    "8.8.8.8": {
        "ip": "8.8.8.8",
        "isp": "Google LLC",
        "org": "Google Public DNS",
        "asn": "AS15169",
        "reverse_dns": "dns.google",
        "country": "United States",
        "region": "California",
        "city": "Mountain View",
        "timezone": "America/Los_Angeles",
        "network_type": "Anycast Public DNS",
        "hosting_provider": False,
        "datacenter": False,
        "vpn": False,
        "proxy": False,
        "tor": False,
        "abuse_score": 0,
        "threat_score": 0,
        "reasons": ["Known clean public DNS resolver"],
        "location_confidence": "MEDIUM",
        "coordinates": [37.4220, -122.0841],
        "first_seen": "2010-01-01T00:00:00Z",
        "last_seen": "2026-08-20T10:25:00Z"
    }
}

MOCK_PHONES = {
    "+15553492048": {
        "phone": "+15553492048",
        "country": "United States",
        "country_code": "US",
        "number_type": "VoIP",
        "carrier": "Twilio (VoIP Gatekeeper)",
        "numbering_region": "California (Area Code 555)",
        "validation_status": "Valid",
        "voip_indicator": True,
        "disposable_indicator": True,
        "reputation": "Poor",
        "spam_reports": 14,
        "risk_score": 68,
        "confidence": 88,
        "caller_name": "Bank Fraud Alert (Spoofed Caller ID)",
        "associated_victim": "Jane Doe (Correlated via Phishing SMS logs)",
        "first_seen": "2026-03-14T08:00:00Z",
        "last_seen": "2026-08-20T09:21:00Z"
    },
    "+919876543210": {
        "phone": "+919876543210",
        "country": "India",
        "country_code": "IN",
        "number_type": "Mobile",
        "carrier": "Reliance Jio",
        "numbering_region": "Maharashtra",
        "validation_status": "Valid",
        "voip_indicator": False,
        "disposable_indicator": False,
        "reputation": "Suspicious",
        "spam_reports": 3,
        "risk_score": 45,
        "confidence": 75,
        "caller_name": "Tech Support Spam (Dynamic Telemetry)",
        "associated_victim": "Raj Patel (Flagged target in logs)",
        "first_seen": "2026-02-10T14:22:00Z",
        "last_seen": "2026-08-20T09:40:00Z"
    },
    "+918608857507": {
        "phone": "+918608857507",
        "country": "India",
        "country_code": "IN",
        "number_type": "Mobile",
        "carrier": "Reliance Jio",
        "numbering_region": "Tamil Nadu",
        "validation_status": "Valid",
        "voip_indicator": False,
        "disposable_indicator": False,
        "reputation": "Clean",
        "spam_reports": 0,
        "risk_score": 0,
        "confidence": 95,
        "caller_name": "Sanjvee",
        "associated_victim": "Unlisted (No incident correlation)",
        "first_seen": "2026-08-10T11:00:00Z",
        "last_seen": "2026-08-20T10:45:00Z"
    }
}

MOCK_DOMAINS = {
    "secure-bank-login.net": {
        "domain": "secure-bank-login.net",
        "registrar": "NameSilo, LLC",
        "creation_date": "2026-08-19T06:12:00Z",
        "expiration_date": "2027-08-19T06:12:00Z",
        "nameservers": ["ns1.dnsowl.com", "ns2.dnsowl.com"],
        "associated_ips": ["185.220.101.4"],
        "ssl_certificate": {
            "issuer": "Let's Encrypt Authority X3",
            "valid_from": "2026-08-19T06:12:00Z",
            "valid_to": "2026-11-17T06:12:00Z",
            "status": "Valid (Active)"
        },
        "dns_records": {
            "A": ["185.220.101.4"],
            "AAAA": [],
            "MX": ["10 mail.secure-bank-login.net"],
            "CNAME": [],
            "TXT": ["v=spf1 include:_spf.google.com ~all"]
        },
        "reputation": "Malicious",
        "threat_score": 90,
        "age_days": 1,
        "reasons": ["Brand impersonation (Bank keywords used)", "Registered less than 48 hours ago", "DNS points to known Tor exit / VPS network"],
        "first_seen": "2026-08-19T06:12:00Z",
        "last_seen": "2026-08-20T10:25:00Z"
    },
    "example.com": {
        "domain": "example.com",
        "registrar": "RESERVED-Internet Assigned Numbers Authority",
        "creation_date": "1992-08-14T00:00:00Z",
        "expiration_date": "2027-08-13T00:00:00Z",
        "nameservers": ["a.iana-servers.net", "b.iana-servers.net"],
        "associated_ips": ["93.184.215.14"],
        "ssl_certificate": {
            "issuer": "DigiCert SHA2 Assured ID Server CA",
            "valid_from": "2026-01-01T00:00:00Z",
            "valid_to": "2027-01-01T00:00:00Z",
            "status": "Valid"
        },
        "dns_records": {
            "A": ["93.184.215.14"],
            "AAAA": ["2606:2800:220:1:248:1893:25c8:1946"],
            "MX": [],
            "CNAME": [],
            "TXT": ["v=spf1 -all"]
        },
        "reputation": "Safe",
        "threat_score": 0,
        "age_days": 12410,
        "reasons": ["Highly established domain, reserved for documentation examples"],
        "first_seen": "1992-08-14T00:00:00Z",
        "last_seen": "2026-08-20T10:25:00Z"
    }
}

MOCK_URLS = {
    "https://secure-bank-login.net/verify": {
        "url": "https://secure-bank-login.net/verify",
        "domain": "secure-bank-login.net",
        "protocol": "https",
        "redirect_chain": ["http://secure-bank-login.net/verify", "https://secure-bank-login.net/verify"],
        "domain_age_days": 1,
        "ssl_active": True,
        "reputation": "MALICIOUS",
        "phishing_indicators": ["Credential harvesting keywords in path (/verify)", "Urgency parameters in URL (none)", "Impersonation in domain stem"],
        "malware_reputation": "Safe (No malware payloads detected)",
        "threat_score": 92,
        "first_seen": "2026-08-19T06:15:00Z",
        "last_seen": "2026-08-20T10:25:00Z"
    }
}

def analyze_phone_intel(phone: str, country_hint: str = None) -> Dict[str, Any]:
    # Clean phone number formatting (leave digits and +)
    clean_number = "+" + "".join(filter(str.isdigit, phone))
    
    if clean_number in MOCK_PHONES:
        data = MOCK_PHONES[clean_number].copy()
        data["mode"] = "MOCK / DEMO DATA"
        return data
        
    # Standard clean generic intelligence
    has_plus = phone.startswith("+")
    is_valid = len(clean_number) >= 8 and len(clean_number) <= 15
    
    return {
        "phone": phone,
        "country": country_hint or "Unknown",
        "country_code": "Unknown",
        "number_type": "Unknown",
        "carrier": "Unknown",
        "numbering_region": "Unknown",
        "validation_status": "Valid" if is_valid else "Invalid",
        "voip_indicator": False,
        "disposable_indicator": False,
        "reputation": "Unknown",
        "spam_reports": 0,
        "risk_score": 0,
        "confidence": 50,
        "caller_name": "Unavailable / Unlisted (CNAM Restricted)",
        "associated_victim": "Unlisted (No incident correlation)",
        "first_seen": "Unknown",
        "last_seen": "Unknown",
        "mode": "MOCK / DEMO DATA (UNRESOLVED)"
    }

def analyze_ip_intel(ip: str) -> Dict[str, Any]:
    ip = ip.strip()
    if ip in MOCK_IPS:
        data = MOCK_IPS[ip].copy()
        data["mode"] = "MOCK / DEMO DATA"
        return data
        
    # Regex checks for IP validity
    ipv4_match = re.match(r"^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$", ip)
    ipv6_match = ":" in ip # Simple check
    
    if not (ipv4_match or ipv6_match):
        return {"error": "Invalid IP format", "ip": ip}
        
    return {
        "ip": ip,
        "isp": "Unknown ISP",
        "org": "Unknown Organization",
        "asn": "Unknown ASN",
        "reverse_dns": "Unknown",
        "country": "Unknown",
        "region": "Unknown",
        "city": "Unknown",
        "timezone": "UTC",
        "network_type": "Unknown",
        "hosting_provider": False,
        "datacenter": False,
        "vpn": False,
        "proxy": False,
        "tor": False,
        "abuse_score": 0,
        "threat_score": 0,
        "reasons": ["No historical intelligence records available for this IP address."],
        "location_confidence": "LOW",
        "coordinates": None,
        "first_seen": "Unknown",
        "last_seen": "Unknown",
        "mode": "MOCK / DEMO DATA (UNRESOLVED)"
    }

def analyze_domain_intel(domain: str) -> Dict[str, Any]:
    domain = domain.lower().strip()
    # Remove protocol prefix if entered
    domain = re.sub(r"^https?://", "", domain)
    domain = domain.split("/")[0]
    
    if domain in MOCK_DOMAINS:
        data = MOCK_DOMAINS[domain].copy()
        data["mode"] = "MOCK / DEMO DATA"
        return data
        
    return {
        "domain": domain,
        "registrar": "Unknown",
        "creation_date": "Unknown",
        "expiration_date": "Unknown",
        "nameservers": [],
        "associated_ips": [],
        "ssl_certificate": {
            "issuer": "Unknown",
            "valid_from": "Unknown",
            "valid_to": "Unknown",
            "status": "Unknown"
        },
        "dns_records": {
            "A": [],
            "AAAA": [],
            "MX": [],
            "CNAME": [],
            "TXT": []
        },
        "reputation": "UNKNOWN",
        "threat_score": 0,
        "reasons": ["Domain was not resolved in mock intelligence intelligence data feeds."],
        "first_seen": "Unknown",
        "last_seen": "Unknown",
        "mode": "MOCK / DEMO DATA (UNRESOLVED)"
    }

def analyze_url_intel(url: str) -> Dict[str, Any]:
    url = url.strip()
    if url in MOCK_URLS:
        data = MOCK_URLS[url].copy()
        data["mode"] = "MOCK / DEMO DATA"
        return data
        
    # Basic URL parsing
    protocol = "https" if url.startswith("https") else "http"
    domain = url.split("://")[-1].split("/")[0] if "://" in url else url.split("/")[0]
    
    return {
        "url": url,
        "domain": domain,
        "protocol": protocol,
        "redirect_chain": [url],
        "domain_age_days": None,
        "ssl_active": False,
        "reputation": "UNKNOWN",
        "phishing_indicators": [],
        "malware_reputation": "Unknown",
        "threat_score": 0,
        "first_seen": "Unknown",
        "last_seen": "Unknown",
        "mode": "MOCK / DEMO DATA (UNRESOLVED)"
    }

def get_confidence_details(indicator_type: str, item_value: str) -> Dict[str, Any]:
    """
    Confidence scoring calculation (0-100%) and context explanations.
    """
    if indicator_type == "IP" and item_value == "185.220.101.4":
        return {
            "score": 92,
            "reasons": [
                "Tor exit list is updated in real-time by dynamic relay consensus directory",
                "High correlation with live abuse telemetry reports",
                "ISP is an established Tor support group (Zwiebelfreunde)"
            ]
        }
    elif indicator_type == "DOMAIN" and item_value == "secure-bank-login.net":
        return {
            "score": 90,
            "reasons": [
                "WHOIS registrar information has been confirmed via RDAP registry",
                "Domain age of 1 day indicates extremely high risk profile matching brand keywords"
            ]
        }
    elif indicator_type == "PHONE" and item_value == "+15553492048":
        return {
            "score": 88,
            "reasons": [
                "Aggregated spam logs from 14 distinct honeypot call sources",
                "VoIP carrier (Twilio) prefix verification matches public network tables"
            ]
        }
    elif indicator_type == "PHONE" and item_value == "+918608857507":
        return {
            "score": 95,
            "reasons": [
                "SIM registration profile verified by direct carrier HLN queries",
                "Valid Mobile operator Jio routing tables in Tamil Nadu matched successfully"
            ]
        }
    elif indicator_type == "URL" and item_value == "https://secure-bank-login.net/verify":
        return {
            "score": 95,
            "reasons": [
                "Exact path string (/verify) coupled with phishing template matches heuristics",
                "Redirect loops verified by crawling engine sandbox"
            ]
        }
        
    return {
        "score": 50,
        "reasons": [
            "Baseline confidence score applied",
            "No active reporting records observed in external repositories"
        ]
    }

def analyze_indicator(value: str, type: str) -> Dict[str, Any]:
    type_upper = type.upper()
    if type_upper == "IP":
        return analyze_ip_intel(value)
    elif type_upper == "PHONE":
        return analyze_phone_intel(value)
    elif type_upper == "DOMAIN":
        return analyze_domain_intel(value)
    elif type_upper == "URL":
        return analyze_url_intel(value)
    return {
        "value": value,
        "type": type,
        "mode": "MOCK / DEMO DATA (UNRESOLVED)"
    }

def get_confidence_score(indicator_type: str, details: Dict[str, Any]) -> int:
    value = details.get("ip") or details.get("phone") or details.get("domain") or details.get("url") or ""
    mock_conf = get_confidence_details(indicator_type, value)
    if mock_conf["score"] != 50:
        return mock_conf["score"]
        
    score = 50
    if details.get("location_confidence") == "HIGH":
        score += 20
    elif details.get("location_confidence") == "MEDIUM":
        score += 10
        
    if details.get("abuse_score", 0) > 80:
        score += 20
    elif details.get("abuse_score", 0) > 50:
        score += 10
        
    if details.get("spam_reports", 0) > 10:
        score += 20
        
    if details.get("age_days", 0) > 365:
        score += 15
        
    return min(score, 100)


