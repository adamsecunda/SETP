from decimal import Decimal
from .models import Order, OrderSide, OrderStatus, OrderType
from django.db import transaction
from django.db.models import F
from backend.apps.holdings.models import Holding
from decimal import Decimal


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

def match_market_order(market_order):
    if market_order.order_type != 'MARKET' or market_order.status != OrderStatus.PENDING:
        return

    with transaction.atomic():
        # Lock the market order
        market_order = Order.objects.select_for_update().get(id=market_order.id)

        opposite_side = OrderSide.SELL if market_order.side == OrderSide.BUY else OrderSide.BUY
        price_order = 'price' if market_order.side == OrderSide.BUY else '-price'  # best first

        opposite_orders = Order.objects.select_for_update().filter(
            asset=market_order.asset,
            side=opposite_side,
            status=OrderStatus.PENDING,
            order_type='LIMIT'
        ).order_by(price_order)

        remaining_qty = market_order.quantity

        for opp in opposite_orders:
            if remaining_qty <= 0:
                break

            fill_qty = min(remaining_qty, opp.quantity - opp.filled_quantity)

            # Fill at the limit order's price
            fill_price = opp.price

            # Update opposite order
            opp.filled_quantity += fill_qty
            if opp.filled_quantity >= opp.quantity:
                opp.status = OrderStatus.FILLED
            opp.save()

            # Update market order
            market_order.filled_quantity += fill_qty
            remaining_qty -= fill_qty

            # Update holdings and balance
            buyer = market_order.user if market_order.side == OrderSide.BUY else opp.user
            seller = opp.user if market_order.side == OrderSide.BUY else market_order.user

            # Buyer gets asset, pays cash
            Holding.objects.update_or_create(
                user=buyer,
                asset=market_order.asset,
                defaults={'quantity': F('quantity') + fill_qty}
            )
            buyer.balance -= fill_qty * fill_price
            buyer.save(update_fields=['balance'])

            # Seller gets cash, loses asset
            Holding.objects.filter(user=seller, asset=market_order.asset).update(
                quantity=F('quantity') - fill_qty
            )
            seller.balance += fill_qty * fill_price
            seller.save(update_fields=['balance'])

        # Update market order status
        if remaining_qty == 0:
            market_order.status = OrderStatus.FILLED
        elif market_order.filled_quantity > 0:
            market_order.status = OrderStatus.PARTIAL
        market_order.save(update_fields=['filled_quantity', 'status'])