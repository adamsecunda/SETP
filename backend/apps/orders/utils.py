from decimal import Decimal
from .models import Order, OrderSide, OrderStatus, OrderType

def get_mid_price(asset):
    best_bid = Order.objects.filter(
        asset=asset,
        side=OrderSide.BUY,
        status=OrderStatus.PENDING,
        type=OrderType.LIMIT
    ).order_by('-limit_price').first()

    best_ask = Order.objects.filter(
        asset=asset,
        side=OrderSide.SELL,
        status=OrderStatus.PENDING,
        type=OrderType.LIMIT
    ).order_by('limit_price').first()

    if not best_bid or not best_ask:
        return None

    return (best_bid.limit_price + best_ask.limit_price) / Decimal('2')