from django.shortcuts import render
from .models import Task, List, Project, Status, Priority
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from datetime import datetime
#page
def home(request):
    lists = List.objects.all()
    tasks = Task.objects.all()
    projects = Project.objects.all()
    status = Status.objects.all()
    priority = Priority.objects.all()
    
    context = {
        'lists': lists,
        'tasks': tasks,
        'projects': projects,
        'status': status,
        'priority': priority,
    }
    
    return render(request, 'home.html', context)

#page
def test(request):
    lists = List.objects.all()
    tasks = Task.objects.all()
    projects = Project.objects.all()

    
    context = {
        'lists': lists,
        'tasks': tasks,
        'projects': projects,
    }
    
    return render(request, 'test.html', context)

#api/sortable.js
@require_http_methods(["POST"])
def update_task_position(request):
    try:
        data = json.loads(request.body)
        task_id = data.get('task_id')
        list_id = data.get('list_id')
        position = data.get('position')

        task = Task.objects.get(id=task_id)
        new_list = List.objects.get(id=list_id)
        
        # Update task's list
        task.list = new_list
        task.save()

        return JsonResponse({
            'status': 'success',
            'message': 'Task position updated successfully'
        })

    except (Task.DoesNotExist, List.DoesNotExist) as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@require_http_methods(["POST"])
def update_list_title(request):
    data = json.loads(request.body)
    list_obj = List.objects.get(id=data['list_id'])
    list_obj.title = data['title'][:25]  # Enforce max length
    list_obj.save()
    return JsonResponse({'status': 'success'})

@require_http_methods(["POST"])
def create_list(request):
    data = json.loads(request.body)
    new_list = List.objects.create(title=data['title'][:25])
    return JsonResponse({
        'id': new_list.id,
        'title': new_list.title
    })

@require_http_methods(["POST"])
def delete_list(request):
    try:
        data = json.loads(request.body)
        list_id = data.get('list_id')
        delete_tasks = data.get('delete_tasks', False)

        list_obj = List.objects.get(id=list_id)
        
        if delete_tasks:
            # Delete all tasks in the list
            Task.objects.filter(list_id=list_id).delete()
        else:
            # Move tasks to the first list (ID: 1)
            Task.objects.filter(list_id=list_id).update(list_id=1)
        
        # Delete the list
        list_obj.delete()

        return JsonResponse({
            'status': 'success',
            'message': 'List and tasks processed successfully'
        })

    except List.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'List not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@require_http_methods(["POST"])
def create_task(request):
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        if not data.get('name'):
            return JsonResponse({'status': 'error', 'message': 'Task name is required'}, status=400)

        # Process dates
        start_date = data.get('start_date', '').replace('/', '-') if data.get('start_date') else None
        end_date = data.get('end_date', '').replace('/', '-') if data.get('end_date') else None

        # Get or validate related objects
        try:
            status = Status.objects.get(id=int(data.get('status', 4)))
            priority = Priority.objects.get(id=int(data.get('priority', 4)))
            
            task_data = {
                'name': data.get('name'),
                'list_id': data.get('list_id'),
                'created_by_id': 1,
                'description': data.get('description'),
                'status': status,
                'priority': priority,
                'start_date': start_date,
                'deadline': end_date,
            }

            # Handle project if provided
            project_id = data.get('project_id')
            if project_id and project_id not in ('null', 'undefined'):
                task_data['project'] = Project.objects.get(id=int(project_id))

            # Create and return task
            task = Task.objects.create(**task_data)
            return JsonResponse({
                'status': 'success',
                'task': {
                    'id': task.id,
                    'name': task.name,
                    'list_id': task.list_id,
                    'project_id': task.project.id if task.project else None,
                    'status': status.id,
                    'priority': priority.id,
                    'description': task.description,
                    'start_date': start_date,
                    'end_date': end_date
                }
            })

        except (Status.DoesNotExist, Priority.DoesNotExist, Project.DoesNotExist) as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
            
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@require_http_methods(["POST"])
def update_task(request):
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        task_id = data.get('task_id')
        if not task_id:
            return JsonResponse({'status': 'error', 'message': 'Task ID is required'}, status=400)

        # Fetch the task to update
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Task not found'}, status=404)

        # Update fields
        task.name = data.get('name', task.name)
        task.description = data.get('description', task.description)
        
        # Update dates directly
        task.start_date = data.get('start_date') or None  # Expecting "YYYY-MM-DD"
        task.deadline = data.get('end_date') or None  # Expecting "YYYY-MM-DD"



        # Update related objects
        if 'status' in data:
            try:
                task.status = Status.objects.get(id=int(data['status']))
            except Status.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Invalid status ID'}, status=400)

        if 'priority' in data:
            try:
                task.priority = Priority.objects.get(id=int(data['priority']))
            except Priority.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Invalid priority ID'}, status=400)

            if 'project_id' in data:
                project_id = data['project_id']
                if project_id in (None, 'null', 'undefined', ''):
                    task.project = None  # Set project to null
                else:
                    try:
                        task.project = Project.objects.get(id=int(project_id))
                    except Project.DoesNotExist:
                        return JsonResponse({'status': 'error', 'message': 'Invalid project ID'}, status=400)

        # Save the updated task
        task.save()

        # Return the updated task data
        return JsonResponse({
            'status': 'success',
            'task': {
                'id': task.id,
                'name': task.name,
                'list_id': task.list_id,
                'project_id': task.project.id if task.project else None,
                'status': task.status.id,
                'priority': task.priority.id,
                'description': task.description,
                'start_date': task.start_date,
                'end_date': task.deadline
            }
        })

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
