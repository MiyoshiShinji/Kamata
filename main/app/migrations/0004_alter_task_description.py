# Generated by Django 5.1.6 on 2025-03-19 06:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0003_alter_priority_priority_alter_status_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
    ]
