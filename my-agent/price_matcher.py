import logging
import re
import httpx
import os

logger = logging.getLogger("fincore.price_matcher")

RAPIDAPI_KEY  = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "uk-supermarkets-product-pricing.p.rapidapi.com")


async def fetch_supermarket_prices(barcode: str) -> list[dict]:
    if not re.fullmatch(r'\d{8,14}', barcode):
        raise ValueError(f"Invalid barcode — expected 8–14 digit EAN/UPC, got: {barcode!r}")

    url = f"https://{RAPIDAPI_HOST}/product_prices_stores"
    headers = {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
    }
    params = {"barcode": barcode}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers, params=params)

        if resp.status_code == 404:
            return []
        if resp.status_code == 403:
            raise ValueError("Price lookup unavailable — API subscription required")
        if resp.status_code == 429:
            raise ValueError("Rate limit exceeded — please try again shortly")

        resp.raise_for_status()

    except httpx.TimeoutException:
        raise ValueError("Price lookup timed out")
    except httpx.HTTPStatusError as exc:
        raise ValueError(f"Price lookup failed (HTTP {exc.response.status_code})")

    try:
        data = resp.json()
    except Exception:
        raise ValueError("Invalid response from price API")

    return _parse_prices(data)


def _parse_prices(data) -> list[dict]:
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        for key in ("prices", "stores", "results", "data", "products"):
            if key in data and isinstance(data[key], list):
                items = data[key]
                break
        else:
            items = [data]
    else:
        return []

    results = []
    for item in items:
        if not isinstance(item, dict):
            continue
        store = (item.get("store_name") or item.get("store") or item.get("supermarket")
                 or item.get("retailer") or item.get("name") or "Unknown")
        price_raw = (item.get("price") or item.get("current_price") or item.get("sale_price")
                     or item.get("regular_price") or 0)
        try:
            price = float(str(price_raw).replace("£", "").replace(",", "").strip())
        except (ValueError, TypeError):
            continue
        if price <= 0:
            continue
        price_per_unit = (item.get("price_per_unit") or item.get("unit_price")
                          or item.get("per_unit") or item.get("price_per_kg") or None)
        if price_per_unit is not None:
            price_per_unit = str(price_per_unit)
        url = item.get("url") or item.get("product_url") or item.get("link") or None
        results.append({"store": str(store), "price": price, "price_per_unit": price_per_unit, "url": url})

    results.sort(key=lambda x: x["price"])
    return results
