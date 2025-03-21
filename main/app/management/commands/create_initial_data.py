from django.core.management.base import BaseCommand
from app.models import Color, Project

class Command(BaseCommand):
    help = 'Creates initial colors and projects'

    def handle(self, *args, **kwargs):
        # Create colors
        colors = [
            'red',
            'blue',
            'green',
            'yellow',
            'purple',
            'orange'
        ]
        
        created_colors = []
        for color_name in colors:
            color, created = Color.objects.get_or_create(color=color_name)
            created_colors.append(color)
            
        # Create a sample project
        Project.objects.get_or_create(
            name="Sample Project",
            color=created_colors[0]  # Using the first color (red)
        )
        
        self.stdout.write(self.style.SUCCESS('Successfully created initial data'))