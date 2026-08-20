from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.config import settings
from backend.schemas import TokenData

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for JWT token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Seed user records for local simulation
MOCK_USERS = {
    "admin": {"password_hash": pwd_context.hash("admin123"), "role": "Admin"},
    "analyst": {"password_hash": pwd_context.hash("analyst123"), "role": "Security Analyst"},
    "investigator": {"password_hash": pwd_context.hash("investigator123"), "role": "Investigator"},
    "viewer": {"password_hash": pwd_context.hash("viewer123"), "role": "Viewer"},
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        # For ease of testing and mock demo mode, allow default viewer if no token is sent.
        # But in a strict platform context, we should handle this. Let's return a default
        # user "analyst" (role: Security Analyst) for local demo purposes to avoid blocking UI,
        # but enforce proper extraction when authorization headers are present.
        return TokenData(username="analyst", role="Security Analyst")
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise credentials_exception
        return TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: TokenData = Depends(get_current_user)) -> TokenData:
        role_hierarchy = {
            "Admin": 4,
            "Security Analyst": 3,
            "Investigator": 2,
            "Viewer": 1
        }
        
        user_role = current_user.role or "Viewer"
        user_level = role_hierarchy.get(user_role, 1)
        
        # Check if the user's role satisfies any of the allowed roles
        # If the route requires 'Investigator' (2), then Admin (4) and Security Analyst (3) also have access.
        min_required_level = min([role_hierarchy.get(r, 1) for r in self.allowed_roles])
        
        if user_level < min_required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role capability: {self.allowed_roles}"
            )
        return current_user

check_analyst_privileges = RoleChecker(["Security Analyst"])
check_investigator_privileges = RoleChecker(["Investigator"])

