# Group-23


## How to run the Django Server


### MacOS
```bash
cd diggidog/backend
python3 -m venv venv
source venv/bin/activate
pip3 install django djangorestframework django-cors-headers
python3 -m pip install Pillow
python3 manage.py makemigrations api
python3 manage.py migrate
python3 manage.py runserver
```

### Windows
```bash
cd diggidog/backend
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


## How to run the frontend
```bash
cd diggidog/frontend
npm install
npm run dev 
```
Open the localhost link



## How to test
```bash
cd diggidog/backend
python3 manage.py test
```






