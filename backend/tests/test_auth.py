from datetime import timedelta
from jose import jwt
from backend.auth import create_access_token, verify_password, get_password_hash
from backend.config import settings

def test_password_hashing():
    pw = "mysecretpassword"
    hashed = get_password_hash(pw)
    assert verify_password(pw, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_create_access_token():
    data = {"sub": "analyst", "role": "Security Analyst"}
    token = create_access_token(data, expires_delta=timedelta(minutes=10))
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "analyst"
    assert decoded["role"] == "Security Analyst"
    assert "exp" in decoded
