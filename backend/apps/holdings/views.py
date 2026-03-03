from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from backend.apps.holdings.models import Holding
from backend.apps.orders.utils import get_mid_price

class PortfolioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        holdings = Holding.objects.filter(user=user)

        total_holdings_value = Decimal('0')
        serialized_holdings = []

        for h in holdings:
            mid_price = get_mid_price(h.asset)
            price = mid_price if mid_price is not None else Decimal('100.00')  # fallback
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
            })

            total_holdings_value += value

        total_portfolio_value = Decimal(user.balance) + total_holdings_value

        return Response({
            "balance": float(user.balance),
            "holdings": serialized_holdings,
            "total_portfolio_value": float(total_portfolio_value),
            "holdings_count": len(holdings),
            "price_source": "mid-price from order book" if mid_price else "fallback $100"
        })