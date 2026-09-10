from pydantic import BaseModel, Field
from typing import Optional, List


class ScoreBreakdown(BaseModel):
    value_for_money: int = Field(..., ge=0, le=100)
    necessity: int = Field(..., ge=0, le=100)
    budget_impact: int = Field(..., ge=0, le=100)


class AnalysisResult(BaseModel):
    product_identified: str
    overall_score: int = Field(..., ge=0, le=100)
    grade: str
    verdict: str
    color: str  # "green" | "amber" | "red"
    breakdown: ScoreBreakdown
    recommendations: List[str]
    financial_insight: str
    alternatives: List[str]
    image_url: Optional[str] = None
    trace_id: Optional[str] = None
    # Product identification fields for price lookups
    product_name: Optional[str] = None  # e.g., "Coca-Cola Original"
    product_brand: Optional[str] = None  # e.g., "Coca-Cola"
    product_volume: Optional[str] = None  # e.g., "500ml"
    product_barcode: Optional[str] = None  # if visible
    product_category: Optional[str] = None  # e.g., "soft_drink", "snack", "grocery"
    # Price estimate from vision model - NO DEFAULT, must be null if unknown
    estimated_price: Optional[float] = None


class AnalyzeRequest(BaseModel):
    image_base64: str
    media_type: str = "image/jpeg"
    user_context: Optional[str] = None
    user_name: Optional[str] = None  # For Langfuse tracing (fallback to user_id)
    session_id: Optional[str] = None  # For Langfuse session continuity


class AnalyzeTextRequest(BaseModel):
    product_description: str  # e.g., "Big ole cookie", "iPhone 15 Pro"
    user_context: Optional[str] = None
    user_name: Optional[str] = None
    session_id: Optional[str] = None


class AnalyzeResponse(BaseModel):
    success: bool
    analysis: Optional[AnalysisResult] = None
    error: Optional[str] = None
    scan_id: Optional[str] = None


class PriceCheckRequest(BaseModel):
    barcode: str
    user_id: Optional[str] = None


class StorePrice(BaseModel):
    store: str
    price: float
    price_per_unit: Optional[str] = None
    url: Optional[str] = None


class PriceCheckResponse(BaseModel):
    success: bool
    barcode: str
    product_name: Optional[str] = None
    cheapest_store: Optional[str] = None
    cheapest_price: Optional[float] = None
    prices: List[StorePrice] = []
    error: Optional[str] = None
