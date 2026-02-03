# Group-23


## How to run the Django Server

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install django djangorestframework django-cors-headers
python manage.py migrate
python manage.py runserver
```

The backend will be available at:

```
http://127.0.0.1:8000/
```

Example API endpoint:

```
http://127.0.0.1:8000/api/hello/
```

