import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.auth import ChangePassword, Token, UserCreate, UserResponse, UserUpdate
from app.services.auth import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_to_response(user: User) -> UserResponse:
    """Build UserResponse from ORM user so serialization never fails (e.g. UUID/id, JSON fields)."""
    raw_prefs = getattr(user, "notification_preferences", None)
    if raw_prefs is None:
        prefs = None
    elif isinstance(raw_prefs, dict):
        prefs = raw_prefs
    else:
        try:
            prefs = json.loads(raw_prefs) if isinstance(raw_prefs, str) and raw_prefs.strip() else None
        except (json.JSONDecodeError, TypeError):
            prefs = None
    return UserResponse(
        id=str(user.id),
        email=str(user.email),
        display_name=user.display_name,
        plan=getattr(user, "plan", "free") or "free",
        notification_preferences=prefs,
    )


@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = create_access_token(str(user.id))
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=_user_to_response(user),
    )


@router.post("/login", response_model=Token)
def login(data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    access_token = create_access_token(str(user.id))
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=_user_to_response(user),
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return _user_to_response(current_user)


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.display_name is not None:
        current_user.display_name = data.display_name.strip() or None
    if data.notification_preferences is not None:
        current_user.notification_preferences = (
            json.dumps(data.notification_preferences) if data.notification_preferences else None
        )
    db.commit()
    db.refresh(current_user)
    return _user_to_response(current_user)


@router.post("/change-password")
def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"ok": True}
