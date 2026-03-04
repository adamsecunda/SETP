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
from rest_framework.pagination import LimitOffsetPagination

def match_market_order(order):
    try:
        asset = order.asset
        user = order.user

        # Get the latest price from the engine
        price = get_price(asset.ticker)

        # Fallback price for demo stability
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
                # Update existing holding with weighted average cost
                new_qty = holding.quantity + qty
                holding.average_price = (
                    (holding.average_price * holding.quantity)
                    + (execution_price * qty)
                ) / new_qty
                holding.quantity = new_qty
                holding.save()
            else:
                # Create new holding entry
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

        # Update order to FILLED
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

        # The serializer handles the balance deduction in its create() method
        order = serializer.save(
            user=request.user,
            side=OrderSide.BUY,
            type=OrderType.MARKET,
            status=OrderStatus.PENDING
        )

        # Immediate execution
        match_market_order(order)
        
        return Response({
            'message': 'Market buy executed successfully',
            'order_id': order.id,
            'status': order.status,
            'ticker': order.asset.ticker
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
            type=OrderType.MARKET,
            status=OrderStatus.PENDING
        )

        # Immediate execution
        match_market_order(order)
        
        return Response({
            'message': 'Market sell executed successfully',
            'order_id': order.id,
            'status': order.status,
            'ticker': order.asset.ticker
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


class HistoryOrdersPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100

class HistoryOrdersListView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = HistoryOrdersPagination

    def get(self, request):
        orders = Order.objects.filter(user=request.user).exclude(
            status__in=[OrderStatus.PENDING, OrderStatus.PARTIAL]
        ).order_by('-timestamp')
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(orders, request)
        
        if page is not None:
            serializer = OrderSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            order = Order.objects.get(id=pk, user=request.user)
            
            # Logic check
            if order.status not in [OrderStatus.PENDING, OrderStatus.PARTIAL]:
                return Response(
                    {"detail": f"Order status is {order.status}. Cannot cancel finalized trades."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            order.status = OrderStatus.CANCELLED
            order.save()
            return Response({"detail": "Order moved to history (CANCELLED)"}, status=status.HTTP_204_NO_CONTENT)
            
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        
