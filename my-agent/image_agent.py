import base64
import json
import logging
import os
import re
import uuid
import boto3
from tracing import get_camera_client

logger = logging.getLogger("fincore.image_agent")

SYSTEM_PROMPT = """You are Fincore — a smart, non-judgmental AI financial advisor.
Your job is to help users make better financial decisions BEFORE they spend money.
You analyse images of products, price tags, receipts, menus, or any purchase scenario.

When given an image, you:
1. IDENTIFY what is being considered for purchase (product, brand, price if visible).
2. SCORE the financial wisdom of this purchase on a 0–100 scale.
3. ASSESS three sub-dimensions (each 0–100):
   - value_for_money: Is the price fair relative to quality/alternatives?
   - necessity: Is this a genuine need or an impulse/luxury buy?
   - budget_impact: Risk of this purchase hurting the user's finances.
4. GIVE 3–5 specific, actionable recommendations.
5. SUGGEST 1–2 cheaper alternatives when relevant.

In addition to scoring, you MUST identify the product:
- "product_name": Full product name with variant (e.g., "Coca-Cola Original 500ml")
- "product_brand": Brand name (e.g., "Coca-Cola")
- "product_volume": Size/volume if visible (e.g., "500ml", "6-pack")
- "product_category": One of: soft_drink, snack, grocery, alcohol, household, personal_care, tech, clothing, other
- "product_barcode": Barcode number if visible in image, otherwise null
- "estimated_price": Your best estimate of the UK retail price in GBP as a number.

PRICE ESTIMATION RULES — CRITICAL:
- NEVER use round integer prices like £1.00, £2.00, £5.00, £10.00, £100.00, £500.00, £1000.00. This is FORBIDDEN.
- Always use realistic decimal prices (e.g., £1.49, £2.29, £9.99, £549.99).
- You MUST justify your price estimate based on the specific product identified.

UK MARKET PRICE GUIDANCE:
- Soft drinks (bottles 500ml-2L): £1.50-3.00
- Soft drinks (cans 330ml): £0.80-1.50
- Snacks (crisps, chocolate, sweets): £0.50-3.00 depending on size and brand
- Smartphones: £200-1500 depending on model, brand, and condition (budget: £200-400, mid-range: £400-700, flagship: £700-1200, premium: £1000-1500)
- Electronics (headphones, tablets, laptops): Research realistic UK retail ranges — headphones £20-400, tablets £150-1200, laptops £300-2500
- Grocery staples: Check typical Tesco/Sainsbury's pricing

PRICE JUSTIFICATION: In your response, your "financial_insight" field must include a brief explanation of how you arrived at the estimated_price based on the product type, brand, and UK market conditions.

Score colour guide:
  70–100 — green  (financially sound — go ahead)
  40–69  — amber  (think carefully — conditions apply)
  0–39   — red    (financial risk — reconsider)

Grade: A (90–100), B (75–89), C (60–74), D (40–59), F (0–39)

ALTERNATIVES GUIDANCE — Category-aware suggestions:
- For tech products (smartphones, electronics, gadgets): Suggest refurbished options from Back Market, eBay refurbished, MusicMagpie, or CEX. Consider older model versions.
- For food/grocery items (soft drinks, snacks, grocery): Suggest supermarket own-brand equivalents (Tesco Everyday Value, Sainsbury's Basics), or budget retailers like Aldi and Lidl.
- For general retail (clothing, household, personal care): Suggest Amazon, Costco, TK Maxx, or discount retailers. Consider multi-buy deals.

ALWAYS respond with ONLY a valid JSON object — no markdown, no extra text:
{
  "product_identified": "<name and brand if visible>",
  "overall_score": <0-100>,
  "grade": "<A|B|C|D|F>",
  "verdict": "<one punchy sentence verdict>",
  "color": "<green|amber|red>",
  "breakdown": {
    "value_for_money": <0-100>,
    "necessity": <0-100>,
    "budget_impact": <0-100>
  },
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"],
  "financial_insight": "<2-3 sentences of deeper financial context INCLUDING price estimate justification>",
  "alternatives": ["<category-appropriate cheaper alternative — see ALTERNATIVES GUIDANCE above>", "<second option based on product type>"],
  "product_name": "<full product name with variant>",
  "product_brand": "<brand name>",
  "product_volume": "<size/volume or null>",
  "product_category": "<soft_drink|snack|grocery|alcohol|household|personal_care|tech|clothing|other>",
  "product_barcode": "<barcode if visible or null>",
  "estimated_price": <realistic UK price as decimal number — NEVER a round integer like 1.00 or 2.00>
}
"""

ANALYSIS_PROMPT = (
    "Analyse this image and return your financial assessment as JSON. "
    "Be honest but supportive — the user wants to make a smart financial choice. "
    "IMPORTANT: Extract precise product details (name, brand, volume, category, barcode if visible) "
    "to enable price comparison across stores."
)


def _build_client(aws_region, aws_access_key_id=None, aws_secret_access_key=None):
    kwargs = {"region_name": aws_region}
    if aws_access_key_id:
        kwargs["aws_access_key_id"] = aws_access_key_id
    if aws_secret_access_key:
        kwargs["aws_secret_access_key"] = aws_secret_access_key
    return boto3.client("bedrock-runtime", **kwargs)


def _parse_json_response(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().strip("`").strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError(f"No JSON found in agent response: {raw[:200]}")


def analyze_image(
    image_base64: str,
    media_type: str = "image/jpeg",
    user_context: str | None = None,
    aws_region: str | None = None,
    aws_access_key_id: str | None = None,
    aws_secret_access_key: str | None = None,
    bedrock_model_id: str | None = None,
    user_id: str | None = None,
    user_name: str | None = None,
    scan_id: str | None = None,
    session_id: str | None = None,
) -> dict:
    region = aws_region or os.getenv("AWS_REGION", "eu-west-2")
    key_id = aws_access_key_id or os.getenv("AWS_ACCESS_KEY_ID")
    secret = aws_secret_access_key or os.getenv("AWS_SECRET_ACCESS_KEY")

    # Model ID priority: parameter > env var > regional default
    # Use eu. prefix for eu-west-2 region, or cross-region inference profile
    model_id = bedrock_model_id or os.getenv(
        "BEDROCK_IMAGE_MODEL_ID",
        "eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
    )

    client = _build_client(region, key_id, secret)

    user_text = ANALYSIS_PROMPT
    if user_context:
        user_text += f"\n\nUser context: {user_context}"

    img_format = media_type.split("/")[-1]
    image_bytes = base64.b64decode(image_base64)

    # Initialize Langfuse trace for Camera project
    langfuse = get_camera_client()
    trace = None
    generation = None

    if langfuse and user_id:
        try:
            trace = langfuse.trace(
                name="product-scan",
                user_id=user_id,
                session_id=session_id or str(uuid.uuid4()),
                metadata={
                    "user_name": user_name or user_id,
                    "scan_id": scan_id or "pending",
                    "media_type": media_type,
                    "image_size_bytes": len(image_bytes),
                },
                tags=["camera", "product-scan"],
            )
            generation = trace.generation(
                name="claude-bedrock-vision",
                model=model_id,
                input={"prompt": ANALYSIS_PROMPT, "user_context": user_context},
                metadata={"region": region},
            )
            logger.info(f"Langfuse Camera trace created: {trace.id} for user {user_name or user_id}")
        except Exception as e:
            logger.warning(f"Failed to create Langfuse Camera trace: {e}")

    try:
        response = client.converse(
            modelId=model_id,
            system=[{"text": SYSTEM_PROMPT}],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "image": {
                                "format": img_format,
                                "source": {"bytes": image_bytes},
                            }
                        },
                        {"text": user_text},
                    ],
                }
            ],
            inferenceConfig={"maxTokens": 1024, "temperature": 0.3},
        )
    except Exception as e:
        # End Langfuse generation with error
        if generation:
            try:
                generation.end(output=f"Error: {str(e)}", level="ERROR")
            except Exception:
                pass
        logger.error(f"Bedrock converse failed with model_id={model_id}, region={region}: {e}")
        raise ValueError(f"Image analysis failed: model_id={model_id} in region={region}. Error: {e}")

    raw_text = response["output"]["message"]["content"][0]["text"]
    result = _parse_json_response(raw_text)

    # Complete Langfuse generation with parsed result
    if generation:
        try:
            generation.end(
                output={
                    "product_identified": result.get("product_identified"),
                    "product_category": result.get("product_category"),
                    "overall_score": result.get("overall_score"),
                    "estimated_price": result.get("estimated_price"),
                    "grade": result.get("grade"),
                },
                usage={
                    "input": len(user_text.split()),
                    "output": len(raw_text.split()),
                },
                metadata={
                    "product_category": result.get("product_category"),
                },
            )
            logger.info(f"Langfuse Camera generation completed: {result.get('product_identified')}")
        except Exception as e:
            logger.warning(f"Failed to end Langfuse Camera generation: {e}")

    return result
