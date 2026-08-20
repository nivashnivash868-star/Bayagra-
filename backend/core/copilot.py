from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models import Investigation, Indicator, Evidence

def generate_copilot_response(db: Session, investigation_id: Optional[str], question: str) -> str:
    """
    Simulates a local Security Copilot AI. It gathers context from the active case
    and answers the analyst's questions using rules-based security templates.
    """
    question_lower = question.lower()
    
    # 1. Gather context if investigation_id is provided
    investigation = None
    indicators: List[Indicator] = []
    evidence: List[Evidence] = []
    
    if investigation_id:
        investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if investigation:
            indicators = db.query(Indicator).filter(Indicator.investigation_id == investigation_id).all()
            evidence = db.query(Evidence).filter(Evidence.investigation_id == investigation_id).all()

    # Context variables
    has_ip = any(ind.type == "IP" for ind in indicators)
    has_phone = any(ind.type == "PHONE" for ind in indicators)
    has_domain = any(ind.type == "DOMAIN" for ind in indicators)
    has_url = any(ind.type == "URL" for ind in indicators)
    
    # 2. Match intent to query types
    if "suspicious" in question_lower or "why" in question_lower or "threat" in question_lower:
        if not investigation:
            return "No investigation selected. Please specify an investigation or load an incident context first."
            
        points = []
        if has_phone:
            points.append("- The phone number (+15553492048) is classified as VoIP (Twilio range) with a poor spam reputation, which is characteristic of caller ID spoofing campaigns.")
        if has_url:
            points.append("- The URL (https://secure-bank-login.net/verify) contains credential harvesting path signatures and brand impersonation stems ('secure-bank-login').")
        if has_domain:
            points.append("- The domain (secure-bank-login.net) was registered less than 24 hours ago, indicating temporary, burner infrastructure.")
        if has_ip:
            points.append("- The resolving IP address (185.220.101.4) matches an active Tor exit node relay, representing high anonymity traffic commonly used to bypass IP-based logging.")
            
        if not points:
            return f"Analyzing '{investigation.title}': No high-severity reputation indicators have been added to this incident's indicator database yet."
            
        return (
            f"### Cybersecurity Findings: {investigation.title}\n\n"
            f"Here is what is suspicious about this incident based on the evidence:\n\n" + 
            "\n".join(points) + 
            "\n\n**Assessment**: Highly probable credential harvesting/phishing attempt. Immediate blocking and credential reset of targeted users is recommended."
        )
        
    elif "summarize" in question_lower or "summary" in question_lower:
        if not investigation:
            return "No investigation selected. To summarize a case, please select one from the dropdown."
            
        status_map = {
            "OPEN": "uncontained and currently under active triage",
            "INVESTIGATING": "actively being analyzed by security engineers",
            "CONTAINED": "contained (malicious vectors blocked/isolated)",
            "RESOLVED": "resolved and closed",
        }
        
        status_desc = status_map.get(investigation.status.upper(), "in active status")
        indicators_desc = ", ".join([f"{ind.type}: {ind.value}" for ind in indicators]) or "no indicators registered yet"
        
        return (
            f"### Incident Summary: {investigation.id} ({investigation.title})\n\n"
            f"**Current Status**: The investigation is **{investigation.status}** ({status_desc}).\n"
            f"**Severity**: {investigation.severity} risk classification.\n"
            f"**Assigned Analyst**: {investigation.assigned_analyst}.\n\n"
            f"**Indicators Found**: {indicators_desc}.\n\n"
            f"**Summary of Attack Chain**:\n"
            f"The incident was initiated by a suspicious incoming communication path. "
            f"A phishing URL was observed, which resolved to a hosted server hiding behind proxy/Tor infrastructure. "
            f"We have captured {len(evidence)} evidence files in the vault."
        )
        
    elif "next" in question_lower or "recommend" in question_lower or "mitigate" in question_lower:
        actions = [
            "1. **Enforce DNS Blacklisting**: block DNS queries to `secure-bank-login.net` on corporate firewalls/DNS resolvers.",
            "2. **Block Connection to IP**: block inbound/outbound TCP traffic to `185.220.101.4` at the perimeter.",
            "3. **SMS Gateway Filter**: Add a keyword rule to the SMS gateway filter for 'secure-bank-login.net'.",
            "4. **User Security Review**: Scan email/message gateway logs for other messages originating from "+ (indicators[0].value if indicators else "the source number") + " to assess campaign scope.",
            "5. **Evidence Hash Verification**: Ensure the captured message headers and screenshots have their SHA-256 integrity hashes logged in the incident records."
        ]
        return (
            "### Recommended Actions for Incident Response:\n\n" +
            "\n".join(actions) +
            "\n\n*Note: Geolocation and IP information are network-approximate. Verify internal authentication logs before lockouts.*"
        )
        
    elif "connect" in question_lower or "relation" in question_lower or "correlate" in question_lower:
        if not investigation:
            return "Please select an active case to run correlation mapping."
        return (
            f"### Indicator Correlations ({investigation.id}):\n\n"
            "I checked all past cases in the threat intelligence console:\n"
            "- **IP 185.220.101.4**: Correlated! This IP was observed in 3 previous investigations (**INC-2026-0012**, **INC-2026-0021**, and **INC-2026-0034**), all relating to brute-force credential stuffing and web scanning targeting the login portal.\n"
            "- **Phone Number**: Not observed in any other registered investigations (new sender ID).\n"
            "- **Domain**: This is a newly registered domain. No historical case correlations."
        )
        
    elif "explain" in question_lower or "what is" in question_lower:
        # User is asking about a specific term or indicator
        if "ip" in question_lower or "185." in question_lower:
            return (
                "### IP Reputation Explanation (185.220.101.4):\n\n"
                "This IP is owned by the organization **Zwiebelfreunde e.V.** in Dresden, Germany. "
                "It is a verified **Tor Exit Node**. Traffic originating from this IP represents anonymous client sessions. "
                "While Tor is a privacy service, SOC teams treat incoming exit relay traffic as high risk due to the "
                "lack of source traceability. Over 85% of active reputation databases classify it as suspicious."
            )
        elif "voip" in question_lower or "phone" in question_lower:
            return (
                "### Phone Intelligence (VoIP Rules):\n\n"
                "VoIP (Voice over Internet Protocol) numbers are telephone numbers assigned via internet services "
                "rather than physical copper/cell lines. Attackers commonly lease these numbers via APIs (e.g. Twilio, Plivo) "
                "to automate phishing spam. Since they can be deleted and recreated instantly, VoIP indicators have a "
                "low baseline trust rating."
            )
        else:
            return (
                "I am your Bayagra Security Copilot. I can analyze the active investigation's indicators, "
                "summarize its status, find case correlations, recommend incident response actions, and explain specific threats. "
                "What would you like me to look into?"
            )
            
    else:
        # Default response
        return (
            "### Bayagra AI Copilot\n\n"
            "I have analyzed the current incident data. You can ask me:\n"
            "- *'What is suspicious about this incident?'*\n"
            "- *'Summarize this investigation.'*\n"
            "- *'Which indicators are connected to other investigations?'*\n"
            "- *'What should I investigate next?'*\n"
            "- *'Explain the risk on the active IP indicator.'*"
        )
