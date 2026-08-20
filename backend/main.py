import os
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import engine, Base, get_db
from backend.models import Investigation, Indicator, Evidence, Watchlist, Alert, AuditLog, User
from backend.schemas import (
    UserLogin, Token, TokenData, AuditLogResponse,
    EvidenceCreate, EvidenceResponse, IndicatorCreate, IndicatorResponse,
    AlertResponse, InvestigationCreate, InvestigationUpdate, InvestigationResponse,
    InvestigationDetailResponse, WatchlistCreate, WatchlistResponse,
    ExtractRequest, ExtractedIOCs, CopilotRequest, UserSignup
)
from backend.auth import (
    verify_password, create_access_token, get_current_user,
    check_analyst_privileges, check_investigator_privileges, MOCK_USERS, get_password_hash
)
from backend.core.intelligence import analyze_indicator, get_confidence_score
from backend.core.risk_engine import calculate_risk_score
from backend.core.ioc_extractor import extract_iocs
from backend.core.correlation import find_correlated_investigations
from backend.core.copilot import generate_copilot_response
from backend.core.reporter import compile_json_report, compile_indicators_csv

# Create SQLite tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bayagra Security Platform API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to log audits
def log_audit(db: Session, user: str, action: str, resource: Optional[str] = None, investigation_id: Optional[str] = None):
    audit = AuditLog(
        user=user,
        action=action,
        target_resource=resource,
        investigation_id=investigation_id,
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

# Startup Database Seeding
@app.on_event("startup")
def seed_database():
    db = next(get_db())
    # Check if INC-2026-0087 already exists
    demo_id = "INC-2026-0087"
    existing = db.query(Investigation).filter(Investigation.id == demo_id).first()
    if not existing:
        # Create Case
        demo_case = Investigation(
            id=demo_id,
            title="Suspicious Phishing Communication",
            description="Phishing SMS reporting account suspension pointing to secure-bank-login.net routed via Tor exit nodes.",
            severity="HIGH",
            status="INVESTIGATING",
            assigned_analyst="analyst",
            created_date=datetime.utcnow(),
            notes="Analyzed source numbers and domains. URL resolves to a credential harvesting site.",
            tags=["phishing", "sms", "tor", "financial"]
        )
        db.add(demo_case)
        db.commit()

        # Seed indicators
        indicators = [
            Indicator(
                value="+15553492048",
                type="PHONE",
                risk_score=45,
                confidence=80,
                severity="MEDIUM",
                details={
                    "valid": True,
                    "carrier": "Twilio VoIP",
                    "line_type": "voip",
                    "country": "United States",
                    "country_code": "US",
                    "location": "California",
                    "spam_score": 60,
                    "reasons": ["VoIP number used in multiple bulk SMS campaigns", "Flagged by 3 users as IRS impersonation"]
                },
                investigation_id=demo_id
            ),
            Indicator(
                value="https://secure-bank-login.net/verify",
                type="URL",
                risk_score=90,
                confidence=95,
                severity="CRITICAL",
                details={
                    "url": "https://secure-bank-login.net/verify",
                    "domain": "secure-bank-login.net",
                    "phishing": True,
                    "malicious": True,
                    "suspicious": True,
                    "brand_impersonated": "Secure Bank Inc.",
                    "redirect_chain": ["https://secure-bank-login.net/verify -> http://phish-login-bank-redir.xyz"],
                    "reasons": ["Phishing signature matched", "Typosquatting brand spoofing detect"]
                },
                investigation_id=demo_id
            ),
            Indicator(
                value="secure-bank-login.net",
                type="DOMAIN",
                risk_score=85,
                confidence=90,
                severity="HIGH",
                details={
                    "domain": "secure-bank-login.net",
                    "registrar": "Namecheap Inc.",
                    "age_days": 1,
                    "nameservers": ["ns1.hostgator.com", "ns2.hostgator.com"],
                    "dns_records": {
                        "A": ["185.220.101.4"],
                        "MX": ["mail.secure-bank-login.net"]
                    },
                    "reasons": ["Domain registered 1 day ago", "Nameserver history mismatch"]
                },
                investigation_id=demo_id
            ),
            Indicator(
                value="185.220.101.4",
                type="IP",
                risk_score=85,
                confidence=85,
                severity="HIGH",
                details={
                    "ip": "185.220.101.4",
                    "isp": "Zwiebelfreunde e.V.",
                    "org": "Tor Exit Node Network",
                    "reverse_dns": "tor-exit.zwiebelfreunde.de",
                    "country": "Germany",
                    "network_type": "Hosting / Tor",
                    "tor": True,
                    "abuse_score": 85,
                    "reasons": ["IP is currently marked as an active Tor exit node"]
                },
                investigation_id=demo_id
            )
        ]
        
        for ind in indicators:
            db.add(ind)
            
        # Seed Evidence
        evidence = Evidence(
            id="e83a2164a2ab16fcf85a9c97a9f73f2a588b39a8c9b20894ac0b73c242a9b34a",
            filename="sms_payload_log.txt",
            uploaded_by="analyst",
            file_type="txt",
            size_bytes=248,
            investigation_id=demo_id,
            notes="SMS capture raw headers and body containing the phishing lure.",
            chain_of_custody=[
                {"timestamp": datetime.utcnow().isoformat(), "action": "Evidence Created", "user": "analyst"},
                {"timestamp": datetime.utcnow().isoformat(), "action": "MD5/SHA256 verified", "user": "system"}
            ]
        )
        db.add(evidence)
        
        # Seed Alerts
        alerts = [
            Alert(
                severity="HIGH",
                indicator="secure-bank-login.net",
                reason="High severity indicator secure-bank-login.net observed on newly created domain.",
                investigation_id=demo_id,
                recommended_action="Block domain resolved IPs on boundary firewall.",
                read=False
            ),
            Alert(
                severity="HIGH",
                indicator="185.220.101.4",
                reason="Tor exit node IP address initiating HTTP requests.",
                investigation_id=demo_id,
                recommended_action="Add IP address to the threat intelligence watchlist.",
                read=False
            )
        ]
        
        for alert in alerts:
            db.add(alert)
            
        # Seed Watchlist
        db.add(Watchlist(
            indicator="185.220.101.4",
            type="IP",
            reason="Active Tor exit node suspect in host scans.",
            risk="HIGH",
            status="ACTIVE"
        ))

        # Seed Related incident to show correlation
        db.add(Investigation(
            id="INC-2026-0012",
            title="Boundary Port Scanning Campaign",
            description="Reconnaissance scans from European ranges.",
            severity="MEDIUM",
            status="RESOLVED",
            assigned_analyst="viewer"
        ))
        db.add(Indicator(
            value="185.220.101.4",
            type="IP",
            risk_score=85,
            confidence=85,
            severity="HIGH",
            details={},
            investigation_id="INC-2026-0012"
        ))
        
        db.commit()
    db.close()


# --- ENDPOINTS ---

# 1. AUTHENTICATION
@app.post("/api/auth/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = MOCK_USERS.get(login_data.username)
    user_role = None
    user_username = None
    if user:
        if not verify_password(login_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_role = user["role"]
        user_username = login_data.username
    else:
        # Check SQL user store
        db_user = db.query(User).filter(User.username == login_data.username).first()
        if not db_user or not verify_password(login_data.password, db_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_role = db_user.role
        user_username = db_user.username

    access_token = create_access_token(data={"sub": user_username, "role": user_role})
    log_audit(db, user_username, "Logged in successful", "Auth Service")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user_role,
        "username": user_username
    }

@app.post("/api/auth/signup")
def signup(signup_data: UserSignup, db: Session = Depends(get_db)):
    if signup_data.username in MOCK_USERS:
        raise HTTPException(status_code=400, detail="Username already exists")
    existing = db.query(User).filter(User.username == signup_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(
        username=signup_data.username,
        password_hash=get_password_hash(signup_data.password),
        role=signup_data.role
    )
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}



# 2. AUDIT LOGS
@app.get("/api/audits", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    check_investigator_privileges(current_user)
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(200).all()


# 3. INVESTIGATIONS
@app.get("/api/investigations", response_model=List[InvestigationResponse])
def list_investigations(db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    return db.query(Investigation).all()

@app.post("/api/investigations", response_model=InvestigationResponse)
def create_investigation(
    data: InvestigationCreate, 
    db: Session = Depends(get_db), 
    current_user: TokenData = Depends(get_current_user)
):
    check_analyst_privileges(current_user)
    # Check duplicate
    existing = db.query(Investigation).filter(Investigation.id == data.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Investigation ID already exists")
    
    new_case = Investigation(
        id=data.id,
        title=data.title,
        description=data.description,
        severity=data.severity,
        status=data.status,
        assigned_analyst=data.assigned_analyst,
        notes=data.notes,
        tags=data.tags,
        created_date=datetime.utcnow()
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    log_audit(db, current_user.username, f"Created investigation: {new_case.id}", "Investigations", new_case.id)
    return new_case

@app.get("/api/investigations/{case_id}", response_model=InvestigationDetailResponse)
def get_investigation_details(
    case_id: str, 
    db: Session = Depends(get_db), 
    current_user: TokenData = Depends(get_current_user)
):
    case = db.query(Investigation).filter(Investigation.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation not found")
    log_audit(db, current_user.username, f"Viewed case details: {case_id}", "Investigations", case_id)
    return case

@app.put("/api/investigations/{case_id}", response_model=InvestigationResponse)
def update_investigation(
    case_id: str,
    data: InvestigationUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    check_analyst_privileges(current_user)
    case = db.query(Investigation).filter(Investigation.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    for field, val in data.dict(exclude_unset=True).items():
        setattr(case, field, val)
        
    db.commit()
    db.refresh(case)
    log_audit(db, current_user.username, f"Updated investigation: {case_id}", "Investigations", case_id)
    return case

@app.delete("/api/investigations/{case_id}")
def delete_investigation(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    check_investigator_privileges(current_user)
    case = db.query(Investigation).filter(Investigation.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    db.delete(case)
    db.commit()
    log_audit(db, current_user.username, f"Deleted investigation: {case_id}", "Investigations")
    return {"message": "Investigation successfully removed"}


# 4. INDICATORS & RISK ENGINE
@app.post("/api/indicators", response_model=IndicatorResponse)
def add_indicator(
    data: IndicatorCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    check_analyst_privileges(current_user)
    
    # Generate reputation details using threat analyzer
    intel_details = analyze_indicator(data.value, data.type)
    
    # Calculate transparent risk score factors
    factors = {
        "phone_spam_reputation": data.type == "PHONE" and intel_details.get("spam_score", 0) > 50,
        "ip_abuse_reputation": data.type == "IP" and intel_details.get("abuse_score", 0) > 50,
        "vpn_proxy_indicator": intel_details.get("vpn", False) or intel_details.get("proxy", False) or intel_details.get("tor", False),
        "malicious_domain": data.type == "DOMAIN" and (intel_details.get("age_days", 365) < 30 or "malicious" in str(intel_details)),
        "phishing_indicator": data.type == "URL" and intel_details.get("phishing", False),
        "repeated_activity": False, # Will be set below
        "malware_infrastructure": intel_details.get("tor", False) or "C2" in str(intel_details)
    }
    
    # Check if indicator has been seen before in general DB
    past_occurs = db.query(Indicator).filter(Indicator.value == data.value).count()
    if past_occurs > 0:
        factors["repeated_activity"] = True
        
    risk_results = calculate_risk_score(factors)
    calculated_risk = risk_results["total_score"]
    severity_level = risk_results["classification"]
    confidence_rating = get_confidence_score(data.type, intel_details)
    
    # Check if it's on the watchlist
    watchlist_entry = db.query(Watchlist).filter(Watchlist.indicator == data.value).first()
    is_watchlisted = watchlist_entry is not None
    wl_reason = watchlist_entry.reason if is_watchlisted else None

    # Merge intelligence details with user details
    final_details = {**intel_details, **(data.details or {})}
    
    new_ind = Indicator(
        value=data.value,
        type=data.type,
        risk_score=calculated_risk,
        confidence=confidence_rating,
        severity=severity_level,
        details=final_details,
        investigation_id=data.investigation_id,
        watchlisted=is_watchlisted or data.watchlisted,
        watchlist_reason=wl_reason or data.watchlist_reason
    )
    db.add(new_ind)
    db.commit()
    db.refresh(new_ind)
    log_audit(db, current_user.username, f"Added indicator: {data.value}", "Indicators", data.investigation_id)
    return new_ind

@app.get("/api/indicators/lookup")
def lookup_indicator(
    value: str,
    type: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    # Live Lookup simulation
    intel_details = analyze_indicator(value, type)
    confidence = get_confidence_score(type, intel_details)
    
    # Calculate factors
    factors = {
        "phone_spam_reputation": type == "PHONE" and intel_details.get("spam_score", 0) > 50,
        "ip_abuse_reputation": type == "IP" and intel_details.get("abuse_score", 0) > 50,
        "vpn_proxy_indicator": intel_details.get("vpn", False) or intel_details.get("proxy", False) or intel_details.get("tor", False),
        "malicious_domain": type == "DOMAIN" and intel_details.get("age_days", 365) < 30,
        "phishing_indicator": type == "URL" and intel_details.get("phishing", False),
        "repeated_activity": False,
        "malware_infrastructure": intel_details.get("tor", False)
    }
    
    risk_results = calculate_risk_score(factors)
    
    log_audit(db, current_user.username, f"Performed lookup: {value}", "Intelligence Services")
    return {
        "value": value,
        "type": type,
        "risk": risk_results,
        "confidence": confidence,
        "details": intel_details
    }


# 5. IOC EXTRACTOR
@app.post("/api/extractor", response_model=ExtractedIOCs)
def extract_iocs_from_text(req: ExtractRequest, current_user: TokenData = Depends(get_current_user)):
    return extract_iocs(req.text)


# 6. EVIDENCE VAULT
@app.post("/api/evidence", response_model=EvidenceResponse)
def upload_evidence(
    filename: str = Form(...),
    file_type: str = Form(...),
    size_bytes: int = Form(...),
    investigation_id: str = Form(...),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    check_analyst_privileges(current_user)
    import hashlib
    # Compute mock content hash based on metadata + timestamp to simulate SHA-256
    hash_seed = f"{filename}-{size_bytes}-{datetime.utcnow().isoformat()}"
    file_hash = hashlib.sha256(hash_seed.encode()).hexdigest()
    
    chain = [
        {
            "timestamp": datetime.utcnow().isoformat(),
            "action": "Evidence Recorded",
            "user": current_user.username,
            "notes": "Uploaded via incident portal"
        }
    ]
    
    evidence = Evidence(
        id=file_hash,
        filename=filename,
        uploaded_by=current_user.username,
        file_type=file_type,
        size_bytes=size_bytes,
        investigation_id=investigation_id,
        notes=notes,
        chain_of_custody=chain
    )
    
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    log_audit(db, current_user.username, f"Uploaded evidence file: {filename}", "Evidence Vault", investigation_id)
    return evidence


# 7. WATCHLIST
@app.get("/api/watchlist", response_model=List[WatchlistResponse])
def get_watchlist(db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    return db.query(Watchlist).all()

@app.post("/api/watchlist", response_model=WatchlistResponse)
def add_to_watchlist(
    data: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    check_analyst_privileges(current_user)
    existing = db.query(Watchlist).filter(Watchlist.indicator == data.indicator).first()
    if existing:
        existing.status = "ACTIVE"
        existing.reason = data.reason or existing.reason
        existing.risk = data.risk or existing.risk
        db.commit()
        db.refresh(existing)
        return existing
        
    entry = Watchlist(
        indicator=data.indicator,
        type=data.type,
        reason=data.reason,
        risk=data.risk,
        status="ACTIVE"
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    log_audit(db, current_user.username, f"Added to watchlist: {data.indicator}", "Watchlist")
    return entry


# 8. ALERTS
@app.get("/api/alerts", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    return db.query(Alert).all()

@app.put("/api/alerts/{alert_id}/read")
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.read = True
    db.commit()
    return {"message": "Alert marked read"}


# 9. CASE CORRELATIONS
@app.get("/api/investigations/{case_id}/correlations")
def get_case_correlations(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    case = db.query(Investigation).filter(Investigation.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation not found")
        
    indicators = db.query(Indicator).filter(Indicator.investigation_id == case_id).all()
    indicator_values = [ind.value for ind in indicators]
    
    correlations = find_correlated_investigations(db, case_id, indicator_values)
    return correlations


# 10. AI SECURITY COPILOT
@app.post("/api/copilot")
def query_security_copilot(
    req: CopilotRequest,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    # Take the last user message
    if not req.messages:
        raise HTTPException(status_code=400, detail="Empty messages list")
    
    last_msg = req.messages[-1]
    if last_msg.role != "user":
        raise HTTPException(status_code=400, detail="Last message must be from user role")
        
    response_text = generate_copilot_response(db, req.investigation_id, last_msg.content)
    
    log_audit(db, current_user.username, f"Queried Security Copilot", "AI Copilot Services", req.investigation_id)
    return {"role": "assistant", "content": response_text}


# 11. REPORTS EXPORTER
@app.get("/api/reports/{case_id}/json")
def export_json_report(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    report = compile_json_report(db, case_id)
    if "error" in report:
        raise HTTPException(status_code=404, detail=report["error"])
    
    # Create response
    json_data = json.dumps(report, indent=2)
    log_audit(db, current_user.username, f"Exported JSON report for case {case_id}", "Reports Exporter", case_id)
    return Response(
        content=json_data,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=Bayagra_Report_{case_id}.json"}
    )

@app.get("/api/reports/{case_id}/csv")
def export_csv_report(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    csv_data = compile_indicators_csv(db, case_id)
    log_audit(db, current_user.username, f"Exported CSV report for case {case_id}", "Reports Exporter", case_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Bayagra_Indicators_{case_id}.csv"}
    )
