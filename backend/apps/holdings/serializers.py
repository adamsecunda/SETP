from rest_framework import serializers
from .models import Holding
from backend.apps.assets.serializers import AssetSerializer

class HoldingSerializer(serializers.ModelSerializer):
    asset = AssetSerializer(read_only=True)
    current_value = serializers.SerializerMethodField()

    class Meta:
        model = Holding
        fields = ['id', 'asset', 'quantity', 'current_value']

    def get_current_value(self, obj):
        # Placeholder price - replace with real fetch later
        placeholder_price = 100.00
        return float(obj.quantity) * placeholder_price