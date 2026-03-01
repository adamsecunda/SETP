from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('user', 'asset', 'side', 'type', 'status', 'quantity', 'timestamp')
    list_filter = ('status', 'side', 'type')
    search_fields = ('user__email', 'asset__ticker')