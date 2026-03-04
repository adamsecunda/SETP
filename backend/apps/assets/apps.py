from django.apps import AppConfig
import threading


class AssetsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.apps.assets"

    def ready(self):
        from backend.market.engine import safe_start_engine
        from backend.apps.assets.models import Asset
        from backend.market.engine import initialize_prices

        def bootstrap_market():
            print("MARKET BACKGROUND WORKER STARTING")

            initialize_prices(Asset.objects.all())
            safe_start_engine()

            print("MARKET ENGINE STARTED SUCCESSFULLY")

        if not getattr(self, "_market_started", False):
            self._market_started = True

            threading.Thread(
                target=bootstrap_market,
                daemon=True
            ).start()