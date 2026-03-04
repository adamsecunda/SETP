from decimal import Decimal
import random
import time
from django.db import transaction

from .models import Order, OrderSide, OrderStatus, OrderType
from backend.apps.holdings.models import Holding
from backend.market.engine import get_price


# Mid price estimation (simulation exchange)
def get_mid_price(asset):
    price = get_price(asset.ticker)

    if price is None:
        return Decimal("100.00")

    return Decimal(str(price))


# Fake market order matcher (immediate fill simulation)
def match_market_order(market_order):
    if market_order.type != OrderType.MARKET:
        return

    if market_order.status != OrderStatus.PENDING:
        return

    # Simulate exchange latency BEFORE locking DB
    time.sleep(random.uniform(3, 4))

    with transaction.atomic():

        market_order = Order.objects.select_for_update().get(
            id=market_order.id
        )

        if market_order.status != OrderStatus.PENDING:
            return

        asset = market_order.asset
        user = market_order.user

        execution_price = get_mid_price(asset)
        qty = Decimal(str(market_order.quantity))

        holding = Holding.objects.filter(
            user=user,
            asset=asset
        ).first()

        if market_order.side == OrderSide.BUY:

            total_cost = execution_price * qty

            if user.balance < total_cost:
                market_order.status = OrderStatus.CANCELLED
                market_order.save(update_fields=["status"])
                return

            if holding is None:
                holding = Holding.objects.create(
                    user=user,
                    asset=asset,
                    quantity=Decimal("0")
                )

            holding.quantity = Decimal(str(holding.quantity)) + qty
            holding.save(update_fields=["quantity"])

            user.balance -= total_cost
            user.save(update_fields=["balance"])

        elif market_order.side == OrderSide.SELL:

            if not holding or Decimal(str(holding.quantity)) < qty:
                market_order.status = OrderStatus.CANCELLED
                market_order.save(update_fields=["status"])
                return

            proceeds = execution_price * qty

            holding.quantity = Decimal(str(holding.quantity)) - qty

            if holding.quantity <= 0:
                holding.delete()
            else:
                holding.save(update_fields=["quantity"])

            user.balance += proceeds
            user.save(update_fields=["balance"])

        market_order.status = OrderStatus.FILLED
        market_order.save(update_fields=["status"])