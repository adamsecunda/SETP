from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from backend.apps.holdings.models import Holding
from backend.apps.holdings.serializers import HoldingSerializer

class PortfolioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get holdings
        holdings = Holding.objects.filter(user=user)
        serializer = HoldingSerializer(holdings, many=True)

        # Calculate total holdings value
        total_holdings_value = sum(
            float(h.quantity) * 100.00  # TODO - replace with real portfolio value
            for h in holdings
        )

        total_portfolio_value = float(user.balance) + total_holdings_value
        
        holdings = holdings.order_by('asset__ticker')

        return Response({
            "balance": float(user.balance),
            "holdings": serializer.data,
            "total_portfolio_value": total_portfolio_value,
            "holdings_count": holdings.count(),
            "note": "Prices are placeholders ($100/share) - real prices will be added later"
        })