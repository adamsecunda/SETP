import redis
import json
import random
import threading
import time
from django.conf import settings

# Redis connection
r = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True
)

PRICE_PREFIX = "price:"
ORDER_QUEUE = "order_queue"


# Price Helpers
def get_price(ticker):
    key = PRICE_PREFIX + ticker
    price = r.get(key)

    if price is None:
        price = random.uniform(25, 300)
        r.set(key, round(price, 4))

    return float(price)


def set_price(ticker, price):
    r.set(PRICE_PREFIX + ticker, round(float(price), 4))


# Initialization
def initialize_prices(asset_queryset):
    print("MARKET INITIALIZATION START")

    for asset in asset_queryset:
        key = PRICE_PREFIX + asset.ticker

        if not r.exists(key):
            r.set(
                key,
                round(random.uniform(25, 300), 4)
            )

    print("MARKET INITIALIZATION COMPLETE")


# Order Queue
def queue_order(ticker, side, quantity):
    order = {
        "ticker": ticker,
        "side": side,
        "quantity": quantity
    }

    r.lpush(ORDER_QUEUE, json.dumps(order))


# Market Simulation Loop
def market_loop():
    print("MARKET ENGINE RUNNING")

    global_trend = random.uniform(-0.02, 0.02)

    while True:
        try:
            # Process queued orders first
            order_data = r.rpop(ORDER_QUEUE)

            if order_data:
                order = json.loads(order_data)

                ticker = order["ticker"]
                side = order["side"]
                qty = float(order["quantity"])

                current_price = get_price(ticker)

                impact = random.uniform(0.02, 0.06) * qty

                if side == "buy":
                    current_price += impact
                else:
                    current_price -= impact

                set_price(ticker, max(1, current_price))

            # Drift simulation
            keys = r.keys(PRICE_PREFIX + "*")

            for key in keys:
                try:
                    price = float(r.get(key))
                    volatility = max(0.05, price * 0.002)

                    drift = random.uniform(-volatility, volatility)

                    drift += random.uniform(-0.05, 0.05)

                    new_price = max(1, price + drift)

                    r.set(key, round(new_price, 4))

                except Exception as inner:
                    print("PRICE UPDATE ERROR:", inner)

            time.sleep(0.5)

        except Exception as e:
            print("MARKET LOOP ERROR:", e)
            time.sleep(1)


# Engine Starter
def start_market_engine():
    if not getattr(start_market_engine, "started", False):
        start_market_engine.started = True

        thread = threading.Thread(
            target=market_loop,
            daemon=True
        )

        thread.start()


def safe_start_engine():
    if not getattr(safe_start_engine, "started", False):
        safe_start_engine.started = True
        start_market_engine()