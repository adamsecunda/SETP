from django.db import models
from backend.apps.users.models import CustomUser
from backend.apps.assets.models import Asset

class Watchlist(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="watchlists")
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("user", "name"),)

    def __str__(self):
        return f"{self.user.email}'s {self.name}"

class WatchlistItem(models.Model):
    watchlist = models.ForeignKey(Watchlist, on_delete=models.CASCADE, related_name="items")
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)

    class Meta:
        unique_together = (("watchlist", "asset"),)

    def __str__(self):
        return f"{self.asset.ticker} in {self.watchlist.name}"