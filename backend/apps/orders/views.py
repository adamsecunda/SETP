from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from backend.market.engine import get_price
from .models import Order, OrderSide, OrderStatus, OrderType
from .serializers import OrderSerializer, PlaceMarketBuySerializer, PlaceMarketSellSerializer
from backend.apps.holdings.models import Holding
from backend.apps.assets.models import Asset
from backend.apps.users.models import CustomUser
from decimal import Decimal

def match_market_order(order):
    try:
        asset = order.asset
        user = order.user

        price = get_price(asset.ticker)

        if price is None:
            price = Decimal("100.00")

        execution_price = Decimal(str(price))
        qty = order.quantity

        holding = Holding.objects.filter(
            user=user,
            asset=asset
        ).first()

        if order.side == OrderSide.BUY:

            if holding:
                new_qty = holding.quantity + qty

                holding.average_price = (
                    (holding.average_price * holding.quantity)
                    + (execution_price * qty)
                ) / new_qty

                holding.quantity = new_qty
                holding.save()

            else:
                Holding.objects.create(
                    user=user,
                    asset=asset,
                    quantity=qty,
                    average_price=execution_price
                )

        elif order.side == OrderSide.SELL:

            if holding:
                holding.quantity -= qty

                if holding.quantity <= 0:
                    holding.delete()
                else:
                    holding.save()

        order.status = OrderStatus.FILLED
        order.save()

    except Exception as e:
        print("MATCH ENGINE ERROR:", e)


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