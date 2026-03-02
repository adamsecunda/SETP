from decimal import Decimal

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import PlaceMarketBuySerializer
from .models import Order, OrderStatus

class PlaceMarketBuyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PlaceMarketBuySerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order = serializer.save()

        return Response({
            "message": "Market buy order placed successfully (pending)",
            "order_id": order.id,
            "asset": order.asset.ticker,
            "quantity": order.quantity,
            "status": order.status,
        }, status=status.HTTP_201_CREATED)
        
    
class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(
                pk=pk,
                user=request.user,
                status=OrderStatus.PENDING
            )
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found, not yours, or not pending"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Refund user order price
        price_per_share = Decimal('100.00') # TODO - replace with real price
        refund_amount = Decimal(order.quantity) * price_per_share

        order.status = OrderStatus.CANCELLED
        order.save()

        request.user.balance += refund_amount
        request.user.save()

        return Response({
            "message": "Order cancelled",
            "refunded": refund_amount,
            "new_balance": float(request.user.balance)
        })