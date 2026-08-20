from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any

# Authentication
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# Audit Log
class AuditLogResponse(BaseModel):
    id: int
    user: str
    action: str
    timestamp: datetime
    ip_address: str
    target_resource: Optional[str] = None
    investigation_id: Optional[str] = None

    class Config:
        from_attributes = True

# Evidence
class EvidenceCreate(BaseModel):
    id: str
    filename: str
    uploaded_by: str
    file_type: str
    size_bytes: int
    investigation_id: str
    related_incident: Optional[str] = None
    notes: Optional[str] = None
    chain_of_custody: List[Dict[str, Any]] = []

class EvidenceResponse(BaseModel):
    id: str
    filename: str
    uploaded_by: str
    timestamp: datetime
    file_type: str
    size_bytes: int
    investigation_id: str
    related_incident: Optional[str] = None
    notes: Optional[str] = None
    chain_of_custody: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

# Indicator
class IndicatorCreate(BaseModel):
    value: str
    type: str
    risk_score: Optional[int] = 0
    confidence: Optional[int] = 50
    severity: Optional[str] = "LOW"
    details: Optional[Dict[str, Any]] = {}
    investigation_id: Optional[str] = None
    watchlisted: Optional[bool] = False
    watchlist_reason: Optional[str] = None

class IndicatorResponse(BaseModel):
    id: int
    value: str
    type: str
    risk_score: int
    confidence: int
    severity: str
    first_seen: datetime
    last_seen: datetime
    details: Dict[str, Any]
    investigation_id: Optional[str] = None
    watchlisted: bool
    watchlist_reason: Optional[str] = None

    class Config:
        from_attributes = True

# Alert
class AlertResponse(BaseModel):
    id: int
    severity: str
    timestamp: datetime
    indicator: str
    reason: str
    investigation_id: Optional[str] = None
    recommended_action: Optional[str] = None
    read: bool

    class Config:
        from_attributes = True

# Investigation
class InvestigationCreate(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    severity: str = "MEDIUM"
    status: str = "OPEN"
    assigned_analyst: Optional[str] = "unassigned"
    notes: Optional[str] = None
    tags: List[str] = []

class InvestigationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_analyst: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class InvestigationResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    assigned_analyst: str
    created_date: datetime
    last_updated: datetime
    notes: Optional[str] = None
    tags: List[str]

    class Config:
        from_attributes = True

class InvestigationDetailResponse(InvestigationResponse):
    indicators: List[IndicatorResponse] = []
    evidence: List[EvidenceResponse] = []
    alerts: List[AlertResponse] = []

    class Config:
        from_attributes = True

# Watchlist
class WatchlistCreate(BaseModel):
    indicator: str
    type: str
    reason: Optional[str] = None
    risk: Optional[str] = "MEDIUM"

class WatchlistResponse(BaseModel):
    id: int
    indicator: str
    type: str
    reason: Optional[str] = None
    risk: str
    created: datetime
    last_observed: datetime
    status: str

    class Config:
        from_attributes = True

# Extracted Indicators Model
class ExtractedIOCs(BaseModel):
    PHONE: List[str] = []
    IP: List[str] = []
    DOMAIN: List[str] = []
    URL: List[str] = []
    EMAIL: List[str] = []
    HASH: List[str] = []

class ExtractRequest(BaseModel):
    text: str

# Copilot chat models
class CopilotMessage(BaseModel):
    role: str # user, system, assistant
    content: str

class CopilotRequest(BaseModel):
    investigation_id: Optional[str] = None
    messages: List[CopilotMessage]

class UserSignup(BaseModel):
    username: str
    password: str
    role: str = "Viewer"

