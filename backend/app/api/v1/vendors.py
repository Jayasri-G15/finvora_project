from fastapi import APIRouter, HTTPException
from sqlalchemy import select, and_

from app.dependencies import CurrentUser, DBSession
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorRead

router = APIRouter()


@router.get("/", response_model=list[VendorRead])
async def list_vendors(current_user: CurrentUser, db: DBSession, limit: int = 100):
    result = await db.execute(
        select(Vendor)
        .where(and_(Vendor.user_id == current_user.id, Vendor.is_active == True))
        .order_by(Vendor.name)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=VendorRead, status_code=201)
async def create_vendor(body: VendorCreate, current_user: CurrentUser, db: DBSession):
    vendor = Vendor(user_id=current_user.id, **body.model_dump())
    db.add(vendor)
    await db.flush()
    return vendor


@router.get("/{vendor_id}", response_model=VendorRead)
async def get_vendor(vendor_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Vendor).where(and_(Vendor.id == vendor_id, Vendor.user_id == current_user.id))
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.patch("/{vendor_id}", response_model=VendorRead)
async def update_vendor(vendor_id: str, body: VendorCreate, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Vendor).where(and_(Vendor.id == vendor_id, Vendor.user_id == current_user.id))
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(vendor, k, v)
    return vendor


@router.delete("/{vendor_id}", status_code=204)
async def deactivate_vendor(vendor_id: str, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Vendor).where(and_(Vendor.id == vendor_id, Vendor.user_id == current_user.id))
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.is_active = False
