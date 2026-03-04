from rest_framework import serializers
from backend.apps.holdings.models import Holding
from backend.apps.orders.utils import get_mid_price, match_market_order
from .models import Order, OrderSide, OrderStatus, OrderType
from backend.apps.assets.models import Asset
from decimal import Decimal
from backend.market.engine import queue_order

class PlaceMarketBuySerializer(serializers.Serializer):
    asset_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

    def validate_asset_id(self, value):
        if not Asset.objects.filter(id=value).exists():
            raise serializers.ValidationError("Asset not found.")
        return value

    def validate(self, data):
        asset = Asset.objects.get(id=data['asset_id'])
        user = self.context['request'].user
        price_per_share = get_mid_price(asset) or Decimal('100.00')
        total_cost = Decimal(data['quantity']) * price_per_share
        if user.balance < total_cost:
            raise serializers.ValidationError(
                f"Insufficient balance. Required: ${total_cost:.2f}, Available: ${user.balance:.2f}"
            )
        data['total_cost'] = total_cost
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        asset = Asset.objects.get(id=validated_data['asset_id'])
        order = Order.objects.create(
            user=user,
            asset=asset,
            side=OrderSide.BUY,
            type=OrderType.MARKET,
            quantity=validated_data['quantity'],
            status=OrderStatus.PENDING,
        )
        # Deduct balance immediately
        user.balance -= validated_data['total_cost']
        user.save()

        queue_order(
            ticker=asset.ticker,
            side="buy",
            quantity=validated_data['quantity']
        )
        
        match_market_order(order)
        
        return order


class PlaceMarketSellSerializer(serializers.Serializer):
    asset_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

    def validate_asset_id(self, value):
        if not Asset.objects.filter(id=value).exists():
            raise serializers.ValidationError("Asset not found.")
        return value

    def validate(self, data):
        asset = Asset.objects.get(id=data['asset_id'])
        user = self.context['request'].user
        # Check holdings
        holding = Holding.objects.filter(user=user, asset=asset).first()
        if not holding or holding.quantity < data['quantity']:
            available = holding.quantity if holding else 0
            raise serializers.ValidationError(
                f"Insufficient holdings. Available: {available}, Requested: {data['quantity']}"
            ) 
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        asset = Asset.objects.get(id=validated_data['asset_id'])
        order = Order.objects.create(
            user=user,
            asset=asset,
            side=OrderSide.SELL,
            type=OrderType.MARKET,
            quantity=validated_data['quantity'],
            status=OrderStatus.PENDING,
        )
        queue_order(
            ticker=asset.ticker,
            side="sell",
            quantity=validated_data['quantity']
        )
        match_market_order(order)
        return order


class OrderSerializer(serializers.ModelSerializer):
    # Shows ticker or name
    asset = serializers.StringRelatedField()  

    class Meta:
        model = Order
        fields = [
            'id',
            'asset',
            'side',
            'type',               
            'quantity',
            'limit_price',       
            'status',
            'timestamp',         
        ]
        read_only_fields = ['id', 'status', 'filled_quantity', 'timestamp']
    
    def get_asset(self, obj):
        return {
            "ticker": obj.asset.ticker,
            "name": obj.asset.name
        }