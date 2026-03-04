from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Order, OrderSide, OrderStatus, OrderType
from .serializers import OrderSerializer, PlaceMarketBuySerializer, PlaceMarketSellSerializer
from backend.apps.holdings.models import Holding
from backend.apps.assets.models import Asset
from backend.apps.users.models import CustomUser
from decimal import Decimal

# Placeholder for matching 
def match_market_order(order):
    pass  


class PlaceMarketBuyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PlaceMarketBuySerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order = serializer.save(
            user=request.user,
            side=OrderSide.BUY,
            order_type=OrderType.MARKET,
            status=OrderStatus.PENDING
        )

        # Auto-match/fill
        match_market_order(order)

        return Response({
            'message': 'Market buy order placed',
            'order_id': order.id,
            'status': order.status,
            'filled_quantity': order.filled_quantity
        }, status=status.HTTP_201_CREATED)


class PlaceMarketSellView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PlaceMarketSellSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order = serializer.save(
            user=request.user,
            side=OrderSide.SELL,
            order_type=OrderType.MARKET,
            status=OrderStatus.PENDING
        )

        # Auto-match/fill
        match_market_order(order)

        return Response({
            'message': 'Market sell order placed',
            'order_id': order.id,
            'status': order.status,
            'filled_quantity': order.filled_quantity
        }, status=status.HTTP_201_CREATED)


class ActiveOrdersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(
            user=request.user,
            status__in=[OrderStatus.PENDING, OrderStatus.PARTIAL]
        ).order_by('-timestamp') 
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            order = Order.objects.get(id=pk, user=request.user)
            if order.status not in [OrderStatus.PENDING, OrderStatus.PARTIAL]:
                return Response({"detail": "Order cannot be cancelled"}, status=status.HTTP_400_BAD_REQUEST)

            order.status = OrderStatus.CANCELLED
            order.save()
            return Response({"detail": "Order cancelled"}, status=status.HTTP_204_NO_CONTENT)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found or not yours"}, status=status.HTTP_404_NOT_FOUND)