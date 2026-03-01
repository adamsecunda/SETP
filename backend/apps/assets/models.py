from django.db import models

class AssetType(models.TextChoices):
    STOCK = "STOCK", "Stock"
    ETF = "ETF", "ETF"

class Asset(models.Model):
    ticker = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=AssetType.choices, default=AssetType.STOCK)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["ticker"]

    def __str__(self):
        return f"{self.ticker} – {self.name}"