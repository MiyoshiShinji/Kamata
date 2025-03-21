from django.contrib import admin
from .models import User, Task, Priority, Status, List, Project, Color

# Register your models here.
admin.site.register(User),
admin.site.register(Task),
admin.site.register(Priority),
admin.site.register(Status),
admin.site.register(List),
admin.site.register(Project),
admin.site.register(Color)
