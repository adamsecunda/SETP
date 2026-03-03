from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from backend.apps.orders.models import Order, OrderSide, OrderType, OrderStatus
from backend.apps.assets.models import Asset
from backend.apps.users.models import CustomUser
from decimal import Decimal
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Preloads a bunch of pending limit orders with fully random prices (1–1000)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--max-tickers',
            type=int,
            default=50,
            help='Maximum number of tickers to preload orders for'
        )
        parser.add_argument(
            '--orders-per-side',
            type=int,
            default=6,
            help='Approximate number of orders per side (buy/sell) per ticker — randomized'
        )

    def handle(self, *args, **options):
        # Use or create a test user with lots of buying power
        email = "orderbook@setp.local"
        user, created = CustomUser.objects.get_or_create(email=email)
        if created:
            user.set_password("orderbook123")
        user.balance = Decimal('1000000.00')
        user.save()
        self.stdout.write(self.style.SUCCESS(f"User ready: {user.email} (${user.balance})"))

        # Get assets (limit to avoid thousands of orders)
        assets = Asset.objects.all()[:options['max_tickers']]
        if not assets.exists():
            self.stdout.write(self.style.ERROR("No assets found. Run your import command first."))
            return

        orders_placed = 0
        with transaction.atomic():
            for asset in assets:
                ticker = asset.ticker

                # Random mid-price between 1 and 1000
                mid_price = Decimal(str(random.uniform(1, 1000))).quantize(Decimal('0.01'))

                # Random number of orders per side (3–10)
                num_buy_orders = random.randint(3, options['orders_per_side'] + 4)
                num_sell_orders = random.randint(3, options['orders_per_side'] + 4)

                # Buy orders: bids below mid (random offset -0.1% to -8%)
                for _ in range(num_buy_orders):
                    offset_pct = random.uniform(-8.0, -0.1)
                    price = mid_price * (1 + Decimal(offset_pct)/100)
                    qty = random.randint(10, 150)
                    Order.objects.create(
                        user=user,
                        asset=asset,
                        side=OrderSide.BUY,
                        type=OrderType.LIMIT,
                        limit_price=price,
                        quantity=qty,
                        status=OrderStatus.PENDING,
                    )
                    orders_placed += 1

                # Sell orders: asks above mid (+0.1% to +8%)
                for _ in range(num_sell_orders):
                    offset_pct = random.uniform(0.1, 8.0)
                    price = mid_price * (1 + Decimal(offset_pct)/100)
                    qty = random.randint(10, 150)
                    Order.objects.create(
                        user=user,
                        asset=asset,
                        side=OrderSide.SELL,
                        type=OrderType.LIMIT,
                        limit_price=price,
                        quantity=qty,
                        status=OrderStatus.PENDING,
                    )
                    orders_placed += 1

        self.stdout.write(self.style.SUCCESS(
            f"Preloaded {orders_placed} randomized pending limit orders across {assets.count()} tickers "
            f"with prices randomly between $1 and $1000."
        ))
        self.stdout.write("Admin view: /admin/orders/order/?status__exact=PENDING")
        self.stdout.write("Tip: try 'python manage.py fill_order <id>' to test filling some orders")