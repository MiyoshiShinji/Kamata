from django import template

register = template.Library()

@register.filter
def filter_by_list(tasks, list_id):
    return tasks.filter(list_id=list_id)

@register.filter
def replace_space(value):
    return value.replace(" ", "_")

@register.filter
def format_date(value):
    if value:
        return value.strftime('%Y/%m/%d')
    return ''