from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, index=True) # e.g. INC-2026-0087
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String, default="OPEN") # OPEN, INVESTIGATING, CONTAINED, RESOLVED, FALSE_POSITIVE, ARCHIVED
    assigned_analyst = Column(String, default="unassigned")
    created_date = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = Column(Text, nullable=True)
    tags = Column(JSON, default=list) # e.g. ["phishing", "sms", "tor"]

    indicators = relationship("Indicator", back_populates="investigation", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="investigation", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="investigation", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="investigation")


class Indicator(Base):
    __tablename__ = "indicators"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    value = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False) # PHONE, IP, DOMAIN, URL, EMAIL, HASH
    risk_score = Column(Integer, default=0) # 0-100
    confidence = Column(Integer, default=50) # 0-100
    severity = Column(String, default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    details = Column(JSON, default=dict)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=True)
    watchlisted = Column(Boolean, default=False)
    watchlist_reason = Column(String, nullable=True)

    investigation = relationship("Investigation", back_populates="indicators")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, index=True) # SHA-256 hash or custom UUID
    filename = Column(String, nullable=False)
    uploaded_by = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    file_type = Column(String, nullable=False) # screenshot, logs, csv, json, txt
    size_bytes = Column(Integer, default=0)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=False)
    related_incident = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    chain_of_custody = Column(JSON, default=list) # List of dictionaries tracking touchpoints

    investigation = relationship("Investigation", back_populates="evidence")


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    indicator = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, nullable=False) # PHONE, IP, DOMAIN, URL, EMAIL, HASH
    reason = Column(Text, nullable=True)
    risk = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    created = Column(DateTime, default=datetime.utcnow)
    last_observed = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="ACTIVE") # ACTIVE, INACTIVE


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    severity = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    timestamp = Column(DateTime, default=datetime.utcnow)
    indicator = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=True)
    recommended_action = Column(Text, nullable=True)
    read = Column(Boolean, default=False)

    investigation = relationship("Investigation", back_populates="alerts")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user = Column(String, nullable=False)
    action = Column(String, nullable=False) # e.g. "Viewed IP 185.220.101.4"
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, default="127.0.0.1")
    target_resource = Column(String, nullable=True)
    investigation_id = Column(String, ForeignKey("investigations.id"), nullable=True)

    investigation = relationship("Investigation", back_populates="audit_logs")

class User(Base):
    __tablename__ = "users"
    username = Column(String, primary_key=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Viewer")

