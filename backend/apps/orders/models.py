from django.db import models
from backend.apps.users.models import CustomUser
from backend.apps.assets.models import Asset

class OrderSide(models.TextChoices):
    BUY = "BUY", "Buy"
    SELL = "SELL", "Sell"

class OrderType(models.TextChoices):
    MARKET = "MARKET", "Market"
    LIMIT = "LIMIT", "Limit"

class OrderStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    FILLED = "FILLED", "Filled"
    CANCELLED = "CANCELLED", "Cancelled"
    PARTIAL = "PARTIAL", "Partially Filled"

class Order(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="orders")
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT)
    side = models.CharField(max_length=10, choices=OrderSide.choices)
    type = models.CharField(max_length=10, choices=OrderType.choices)
    quantity = models.PositiveIntegerField()
    limit_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.side} {self.quantity} {self.asset.ticker} ({self.status})"