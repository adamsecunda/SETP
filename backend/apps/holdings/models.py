from django.db import models
from backend.apps.users.models import CustomUser
from backend.apps.assets.models import Asset

class Holding(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="holdings")
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = (("user", "asset"),)
        verbose_name_plural = "holdings"

    def __str__(self):
        return f"{self.user} holds {self.quantity} × {self.asset.ticker}"