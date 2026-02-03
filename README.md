# Group-23


## How to run the Django Server


### MacOS
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install django djangorestframework django-cors-headers
python3 manage.py migrate
python3 manage.py runserver
```

### Windows
```bash
cd backend
python -m venv venv
venv\Scripts\activate
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

