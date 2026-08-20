import re
from typing import Dict, List

# Regex Patterns
IPV4_PATTERN = r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b"
IPV6_PATTERN = r"\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b"
EMAIL_PATTERN = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
URL_PATTERN = r"https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)"
MD5_PATTERN = r"\b[a-fA-F0-9]{32}\b"
SHA256_PATTERN = r"\b[a-fA-F0-9]{64}\b"

# Phone regex supporting international prefix + and spacing/dashes
PHONE_PATTERN = r"\+?\b[0-9]{1,3}[-.\s]?\(?[0-9]{1,4}\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}\b"

# Domain pattern (must not capture emails or URLs directly as domain stem)
DOMAIN_PATTERN = r"\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}\b"

def validate_ipv4(ip: str) -> bool:
    parts = ip.split(".")
    if len(parts) != 4:
        return False
    return all(0 <= int(part) <= 255 for part in parts if part.isdigit())

def extract_iocs(text: str) -> Dict[str, List[str]]:
    """
    Scans the given input text string for key security indicators.
    Returns lists of extracted unique indicators grouped by type:
    IP, PHONE, DOMAIN, URL, EMAIL, HASH
    """
    iocs = {
        "PHONE": [],
        "IP": [],
        "DOMAIN": [],
        "URL": [],
        "EMAIL": [],
        "HASH": []
    }
    
    if not text:
        return iocs

    # Extract URLs first so they don't pollute domain/IP/hash extraction
    urls = re.findall(URL_PATTERN, text)
    for url in urls:
        if url not in iocs["URL"]:
            iocs["URL"].append(url)
            
    # Extract Emails next so they don't pollute domains
    emails = re.findall(EMAIL_PATTERN, text)
    for email in emails:
        if email not in iocs["EMAIL"]:
            iocs["EMAIL"].append(email)
            
    # Extract IPv4 addresses
    ipv4s = re.findall(IPV4_PATTERN, text)
    for ip in ipv4s:
        if validate_ipv4(ip) and ip not in iocs["IP"]:
            iocs["IP"].append(ip)
            
    # Extract IPv6 addresses
    ipv6s = re.findall(IPV6_PATTERN, text)
    for ip in ipv6s:
        if ip not in iocs["IP"]:
            iocs["IP"].append(ip)

    # Extract MD5 and SHA-256 Hashes
    md5s = re.findall(MD5_PATTERN, text)
    for hash_val in md5s:
        if hash_val not in iocs["HASH"]:
            iocs["HASH"].append(hash_val.lower())
            
    sha256s = re.findall(SHA256_PATTERN, text)
    for hash_val in sha256s:
        # Avoid SHA-256 matching as MD5 since it's hex. SHA256 has 64 chars.
        if hash_val not in iocs["HASH"]:
            iocs["HASH"].append(hash_val.lower())
            
    # Remove matched MD5 hashes that are inside SHA-256 matches
    iocs["HASH"] = [h for h in iocs["HASH"] if not any(h != other and h in other for other in iocs["HASH"])]

    # Extract Phone Numbers
    phones = re.findall(PHONE_PATTERN, text)
    for phone in phones:
        # Clean non-digit characters except starting '+' to check digits count
        clean = "".join(c for c in phone if c.isdigit() or c == "+")
        # Validate typical phone digit lengths: 7-15 digits
        digits_count = len([c for c in clean if c.isdigit()])
        if digits_count >= 7 and digits_count <= 15:
            # Let's verify it is not just a standard number or date (e.g. 2026-08-20)
            if not (len(clean) == 8 and clean.isdigit() and (clean.startswith("20") or clean.startswith("19"))):
                if phone.strip() not in iocs["PHONE"]:
                    iocs["PHONE"].append(phone.strip())

    # Extract Domains (excluding matches inside emails or URLs already extracted)
    domains = re.findall(DOMAIN_PATTERN, text)
    for domain in domains:
        # Ignore if it's part of an email address
        if any(domain in email for email in iocs["EMAIL"]):
            continue
        # Ignore if it matches an IP
        if domain in iocs["IP"]:
            continue
        # Clean domain
        domain_lower = domain.lower()
        # Verify it's not a common file extension in logs (e.g., config.sys, main.py, test.log)
        if domain_lower.endswith((".py", ".log", ".sys", ".txt", ".json", ".csv", ".exe", ".dll", ".png", ".jpg")):
            continue
        if domain_lower not in iocs["DOMAIN"]:
            iocs["DOMAIN"].append(domain_lower)

    return iocs
