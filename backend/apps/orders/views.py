from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from backend.market.engine import get_price
from .models import Order, OrderSide, OrderStatus, OrderType
from .serializers import (
    OrderSerializer,
    PlaceMarketBuySerializer,
    PlaceMarketSellSerializer,
)
from backend.apps.holdings.models import Holding
from backend.apps.assets.models import Asset
from backend.apps.users.models import CustomUser
from decimal import Decimal
from rest_framework.pagination import LimitOffsetPagination
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiParameter
from drf_spectacular.types import OpenApiTypes


def match_market_order(order):
    try:
        asset = order.asset
        user = order.user
        price = get_price(asset.ticker)
        if price is None:
            price = Decimal("100.00")

        execution_price = Decimal(str(price))
        qty = order.quantity
        holding = Holding.objects.filter(user=user, asset=asset).first()

        if order.side == OrderSide.BUY:
            if holding:
                new_qty = holding.quantity + qty
                holding.average_price = (
                    (holding.average_price * holding.quantity) + (execution_price * qty)
                ) / new_qty
                holding.quantity = new_qty
                holding.save()
            else:
                Holding.objects.create(
                    user=user, asset=asset, quantity=qty, average_price=execution_price
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

# Reusable Example
insufficient_funds_example = OpenApiExample(
    "Insufficient Funds",
    status_codes=["400"],
    value={"detail": "Insufficient balance to cover order cost (including fees)."},
)

class PlaceMarketBuyView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Execute Market Buy",
        description="Submits a buy order. Validation checks funds, balance is deducted immediately, and holdings are updated using weighted average cost.",
        request=PlaceMarketBuySerializer,
        responses={201: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        examples=[
            OpenApiExample(
                "Typical Buy Order",
                value={"ticker": "AAPL", "quantity": 10},
            ),
            insufficient_funds_example,
        ],
        tags=["Trading"]
    )
    def post(self, request):
        serializer = PlaceMarketBuySerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order = serializer.save(
            user=request.user, side=OrderSide.BUY, type=OrderType.MARKET, status=OrderStatus.PENDING
        )
        match_market_order(order)

        return Response({
            "message": "Market buy executed successfully",
            "order_id": order.id,
            "status": order.status,
            "ticker": order.asset.ticker
        }, status=status.HTTP_201_CREATED)

class PlaceMarketSellView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Execute Market Sell",
        description="Submits a sell order. Checks if user owns the asset quantity, removes from holdings, and credits cash balance.",
        request=PlaceMarketSellSerializer,
        responses={201: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        examples=[
            OpenApiExample(
                "Typical Sell Order",
                value={"ticker": "TSLA", "quantity": 5},
            )
        ],
        tags=["Trading"]
    )
    def post(self, request):
        serializer = PlaceMarketSellSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order = serializer.save(
            user=request.user, side=OrderSide.SELL, type=OrderType.MARKET, status=OrderStatus.PENDING
        )
        match_market_order(order)

        return Response({
            "message": "Market sell executed successfully",
            "order_id": order.id,
            "status": order.status,
            "ticker": order.asset.ticker
        }, status=status.HTTP_201_CREATED)

class ActiveOrdersListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List Active Orders",
        description="Returns all orders currently in PENDING or PARTIAL status.",
        responses={200: OrderSerializer(many=True)},
        tags=["Trading"]
    )
    def get(self, request):
        orders = Order.objects.filter(
            user=request.user, status__in=[OrderStatus.PENDING, OrderStatus.PARTIAL]
        ).order_by("-timestamp")
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

class HistoryOrdersPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100

class HistoryOrdersListView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = HistoryOrdersPagination

    @extend_schema(
        summary="Get Order History",
        description="Returns paginated list of finalized orders (FILLED, CANCELLED). Uses limit and offset query parameters.",
        responses={200: OrderSerializer(many=True)},
        tags=["Portfolio"]
    )
    def get(self, request):
        orders = (
            Order.objects.filter(user=request.user)
            .exclude(status__in=[OrderStatus.PENDING, OrderStatus.PARTIAL])
            .order_by("-timestamp")
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(orders, request)
        if page is not None:
            serializer = OrderSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Cancel Pending Order",
        description="Updates order status to CANCELLED. Only works for orders that are not yet finalized.",
        responses={204: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        tags=["Trading"]
    )
    def delete(self, request, pk):
        try:
            order = Order.objects.get(id=pk, user=request.user)
            if order.status not in [OrderStatus.PENDING, OrderStatus.PARTIAL]:
                return Response(
                    {"detail": f"Order status is {order.status}. Cannot cancel finalized trades."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            order.status = OrderStatus.CANCELLED
            order.save()
            return Response({"detail": "Order cancelled"}, status=status.HTTP_204_NO_CONTENT)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)