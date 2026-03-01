from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),  # ← change to your previous migration name if different
    ]

    operations = [
        migrations.AddField(
            model_name='CustomUser',
            name='is_superuser',
            field=models.BooleanField(
                default=False,
                help_text='Designates that this user has all permissions without explicitly assigning them.',
                verbose_name='superuser status',
            ),
        ),
    ]