from django.core.management.base import BaseCommand
from django.db import transaction
from backend.apps.orders.models import Order, OrderStatus, OrderSide
from backend.apps.holdings.models import Holding
from decimal import Decimal

class Command(BaseCommand):
    help = 'Fills a pending order (updates holdings/balance and marks as filled)'

    def add_arguments(self, parser):
        parser.add_argument('order_id', type=int, help='ID of the order to fill')

    def handle(self, *args, **options):
        order_id = options['order_id']

        try:
            order = Order.objects.select_for_update().get(
                id=order_id,
                status=OrderStatus.PENDING
            )
        except Order.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Order {order_id} not found or not pending."))
            return

        with transaction.atomic():
            if order.side == OrderSide.BUY:
                # Add/update holding
                holding, created = Holding.objects.get_or_create(
                    user=order.user,
                    asset=order.asset,
                    defaults={'quantity': 0}
                )
                holding.quantity += order.quantity
                holding.save()

                action = f"Added {order.quantity} {order.asset.ticker} to holdings"
            else:  # SELL
                # Reduce holding
                try:
                    holding = Holding.objects.select_for_update().get(
                        user=order.user,
                        asset=order.asset
                    )
                except Holding.DoesNotExist:
                    self.stdout.write(self.style.ERROR("No holding found for sell order"))
                    return

                if holding.quantity < order.quantity:
                    self.stdout.write(self.style.ERROR(f"Insufficient holdings: {holding.quantity} < {order.quantity}"))
                    return

                holding.quantity -= order.quantity
                holding.save()

                # Add cash to balance (using placeholder price)
                price_per_share = Decimal('100.00')
                cash_received = Decimal(order.quantity) * price_per_share
                order.user.balance += cash_received
                order.user.save()

                action = f"Sold {order.quantity} {order.asset.ticker}, added ${cash_received:.2f} to balance"

            # Mark as filled
            order.status = OrderStatus.FILLED
            order.save()

            self.stdout.write(self.style.SUCCESS(f"Order {order_id} FILLED successfully."))
            self.stdout.write(self.style.SUCCESS(action))
            self.stdout.write(f"New balance: ${order.user.balance:.2f}")
            if order.side == OrderSide.BUY:
                self.stdout.write(f"New holding quantity: {holding.quantity}")
            else:
                self.stdout.write(f"New holding quantity: {holding.quantity}")
