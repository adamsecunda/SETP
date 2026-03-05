from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from backend.apps.holdings.models import Holding
from backend.apps.holdings.serializers import HoldingSerializer
from backend.apps.orders.utils import get_mid_price
from decimal import Decimal
from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes

class PortfolioView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Portfolio",
        # Use simple lines instead of Markdown bolding/bullets if you're worried about compatibility
        description="Calculates total net worth by combining cash balance and live asset valuations. Pricing uses order book mid-prices with a $100.00 fallback for simulation stability.",
        responses={200: OpenApiTypes.OBJECT},
        examples=[
            OpenApiExample(
                'Portfolio Response Example',
                value={
                    "balance": 1250.50,
                    "holdings": [
                        {
                            "asset": {"ticker": "AAPL", "name": "Apple Inc.", "type": "STOCK"},
                            "quantity": 10,
                            "current_price": 175.25,
                            "current_value": 1752.50,
                            "price_source": "order book mid-price"
                        }
                    ],
                    "total_portfolio_value": 3003.00,
                    "holdings_count": 1,
                    "note": "Prices are derived from order book mid-price where available"
                }
            )
        ],
        tags=['Portfolio Management']
    )
    def get(self, request):
        user = request.user
        holdings = Holding.objects.filter(user=user)

        total_holdings_value = Decimal('0')
        serialized_holdings = []

        for h in holdings:
            mid_price = get_mid_price(h.asset)
            price = mid_price if mid_price is not None else Decimal('100.00')
            value = Decimal(h.quantity) * price

            serialized_holdings.append({
                "asset": {
                    "ticker": h.asset.ticker,
                    "name": h.asset.name,
                    "type": h.asset.type,
                },
                "quantity": h.quantity,
                "current_price": float(price),
                "current_value": float(value),
                "price_source": "order book mid-price" if mid_price is not None else "fallback $100"
            })

            total_holdings_value += value

        total_portfolio_value = Decimal(user.balance) + total_holdings_value

        return Response({
            "balance": float(user.balance),
            "holdings": serialized_holdings,
            "total_portfolio_value": float(total_portfolio_value),
            "holdings_count": holdings.count(),
            "note": "Prices are derived from order book mid-price where available"
        })