from django.contrib import admin

from django.contrib import admin
from .models import Asset

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('id','ticker', 'name', 'type', 'created_at')
    search_fields = ('ticker', 'name')
    list_filter = ('type',)