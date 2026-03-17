from django.contrib import admin
from django.contrib.admin import AdminSite
from .models import User, Competition, Dog, Participant, Ad, Like, Comment
from django.utils.html import format_html

class CustomAdminSite(AdminSite):
    site_header = "DiggiDog"
    site_title = "Admin"
    index_title = "Administration"
    site_url = "http://localhost:5173/"

    def has_permission(self, request):
        return request.user.is_authenticated and request.user.is_admin


class DogAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "breed", "age", "owner", "preview")

    def preview(self, obj):
        if obj.picture:
            return format_html('<img src="{}" width="50" />', obj.picture)
        return ""
    

class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "name", "is_admin")


class CompetitionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description", "start_date", "end_date", "max_participants", "created_by", "preview")

    def preview(self, obj):
        if obj.picture:
            return format_html('<img src="{}" width="50" />', obj.picture.url)
        return ""


class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "competition", "dog")


class AdAdmin(admin.ModelAdmin):
    list_display = ("id", "file", "preview")

    def preview(self, obj):
        if obj.file:
            return format_html('<img src="{}" width="50" />', obj.file.url)
        return ""

class LikeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "participant")

class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "participant", "user", "text", "created_at")


admin_site = CustomAdminSite(name="custom_admin")

admin_site.register(User, UserAdmin)
admin_site.register(Competition, CompetitionAdmin)
admin_site.register(Dog, DogAdmin)
admin_site.register(Participant, ParticipantAdmin)
admin_site.register(Ad, AdAdmin)
admin_site.register(Like, LikeAdmin)
admin_site.register(Comment, CommentAdmin)

