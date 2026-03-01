from django.contrib import admin
from .models import Holding

@admin.register(Holding)
class HoldingAdmin(admin.ModelAdmin):
    list_display = ('user', 'asset', 'quantity')
    list_filter = ('user',)
    search_fields = ('user__email', 'asset__ticker')