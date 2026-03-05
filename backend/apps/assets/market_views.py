from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from backend.market.engine import r, PRICE_PREFIX
from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes

@extend_schema(
    summary="Get All Live Prices",
    description="Fetches real-time price data from Redis for all tracked assets in the simulation engine.",
    responses={200: OpenApiTypes.OBJECT},
    examples=[
        OpenApiExample(
            'Live Price List Example',
            value=[
                {"ticker": "AAPL", "price": 150.25},
                {"ticker": "TSLA", "price": 675.10},
                {"ticker": "BTC", "price": 48000.50}
            ]
        )
    ],
    tags=['Market Data']
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def live_prices(request):
    """
    Retrieves current ticker prices from the Redis cache.
    """
    keys = r.keys(PRICE_PREFIX + "*")

    data = []
    for key in keys:
        ticker = key.decode("utf-8").replace(PRICE_PREFIX, "") if isinstance(key, bytes) else key.replace(PRICE_PREFIX, "")
        price_val = r.get(key)
        if price_val:
            data.append({
                "ticker": ticker,
                "price": float(price_val)
            })
            
    return Response(data)