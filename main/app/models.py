from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)


class Task(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    priority = models.ForeignKey('Priority', on_delete=models.CASCADE, null=True, blank=True)
    status = models.ForeignKey('Status', on_delete=models.CASCADE, null=True, blank=True)
    list = models.ForeignKey('List', on_delete=models.CASCADE)
    project = models.ForeignKey('Project', on_delete=models.CASCADE,  null=True, blank=True)
    name = models.CharField(max_length=50)
    is_completed = models.BooleanField(default=False)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)



class Priority(models.Model):
    priority = models.CharField(max_length=10, null=True, blank=True)


class Status(models.Model):
    status = models.CharField(max_length=10, null=True, blank=True)

    
class List(models.Model):
    title = models.CharField(max_length=25)



class Project(models.Model):
    name = models.CharField(max_length=50)
    color = models.ForeignKey('Color', on_delete=models.CASCADE)



class Color(models.Model):
    color = models.CharField(max_length=30)

