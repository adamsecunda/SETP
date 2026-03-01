import csv
import kagglehub
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from backend.apps.assets.models import Asset, AssetType


class Command(BaseCommand):
    help = (
        "Downloads the latest 'jacksoncrow/stock-market-dataset' from Kaggle "
        "using kagglehub, extracts symbols_valid_meta.csv, "
        "and imports tickers/names/types into the Asset model."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview what would be imported without saving to DB",
        )
        parser.add_argument(
            "--force-download",
            action="store_true",
            help="Force re-download even if file exists",
        )

    def handle(self, *args, **options):
        # Step 1: Download dataset via kagglehub (caches locally automatically)
        self.stdout.write(self.style.NOTICE("Downloading/using Kaggle dataset via kagglehub..."))

        try:
            dataset_path = kagglehub.dataset_download("jacksoncrow/stock-market-dataset")
            csv_path = Path(dataset_path) / "symbols_valid_meta.csv"

            if not csv_path.is_file():
                self.stdout.write(self.style.ERROR(f"CSV not found in downloaded dataset: {csv_path}"))
                return

            self.stdout.write(self.style.SUCCESS(f"Using CSV: {csv_path}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"kagglehub download failed: {e}"))
            self.stdout.write("Fallback: please manually place symbols_valid_meta.csv in backend/data/kaggle/")
            return

        # Step 2: Import the CSV
        created = 0
        skipped = 0
        errors = 0

        with open(csv_path, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                ticker = row.get("Symbol", "").strip().upper()
                name = row.get("Security Name", "").strip()

                if not ticker or not name:
                    continue

                etf_flag = row.get("ETF", "").strip().upper()
                asset_type = AssetType.ETF if etf_flag == "Y" else AssetType.STOCK

                if options["dry_run"]:
                    self.stdout.write(f"[DRY RUN] {ticker} – {name} ({asset_type})")
                    created += 1
                    continue

                try:
                    asset, is_new = Asset.objects.get_or_create(
                        ticker=ticker,
                        defaults={
                            "name": name,
                            "type": asset_type,
                            "description": "Imported from Kaggle stock-market-dataset via kagglehub",
                        },
                    )

                    if is_new:
                        created += 1
                        if created <= 5:
                            self.stdout.write(f"Created: {ticker} – {name} ({asset_type})")
                    else:
                        skipped += 1

                except Exception as e:
                    errors += 1
                    self.stdout.write(self.style.WARNING(f"Error on {ticker}: {e}"))

        if options["dry_run"]:
            self.stdout.write(
                self.style.NOTICE(f"\nDry run: would create {created} new assets")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nImport complete:\n"
                    f"Created: {created} new assets\n"
                    f"Skipped (already existed): {skipped}\n"
                    f"Errors: {errors}\n"
                    f"Total assets now: {Asset.objects.count()}"
                )
            )

        if created > 0 and not options["dry_run"]:
            self.stdout.write(
                self.style.NOTICE("Browse at: /admin/assets/asset/")
            )