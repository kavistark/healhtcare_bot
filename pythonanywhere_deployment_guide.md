# Step-by-Step Guide to Hosting on PythonAnywhere

This guide explains how to deploy your Django chatbot project onto [PythonAnywhere](https://www.pythonanywhere.com/).

---

## Step 1: Upload Your Code to GitHub
1. Create a new repository on GitHub (e.g. `adhiran-chatbot`).
2. Push your project folder to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Configure deployment"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Clone the Project on PythonAnywhere
1. Log into your [PythonAnywhere Account](https://www.pythonanywhere.com/).
2. On your PythonAnywhere Dashboard, go to **Consoles** and open a new **Bash** console.
3. Clone your GitHub repository into PythonAnywhere:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```
4. Move into the project directory:
   ```bash
   cd YOUR_REPO_NAME
   ```

---

## Step 3: Set Up a Virtual Environment & Install Dependencies
In the same PythonAnywhere Bash console, run:
1. Create a virtual environment (using Python 3.10 or 3.11):
   ```bash
   mkvirtualenv --python=/usr/bin/python3.10 chatbot-venv
   ```
   *(This will automatically activate the virtual environment `(chatbot-venv)`)*

2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

---

## Step 4: Run Migrations, Collect Static Files, & Generate Data
In the active virtual environment console:
1. Run the database migrations:
   ```bash
   python manage.py migrate
   ```
2. Collect static files (styles, scripts, images):
   ```bash
   python manage.py collectstatic --noinput
   ```
3. Generate the required CSV database entries (if they are not already there):
   ```bash
   python generate_data.py
   ```

---

## Step 5: Configure the Web App on PythonAnywhere Dashboard
1. Go to the **Web** tab on the PythonAnywhere dashboard.
2. Click **Add a new web app**.
3. Choose **Manual Configuration** (do NOT choose the Django option, manual is easier to point to a custom virtualenv).
4. Choose **Python 3.10** (or whichever version you used in Step 3).
5. Once created, configure the following fields under the **Web** tab:

### A. Code Paths
* **Source code**: `/home/YOUR_USERNAME/YOUR_REPO_NAME`
* **Working directory**: `/home/YOUR_USERNAME/YOUR_REPO_NAME`

### B. Virtualenv
* **Virtualenv path**: `/home/YOUR_USERNAME/.virtualenvs/chatbot-venv`

### C. Static Files (Crucial for styling to load!)
In the **Static files** table, add the following entry:
* **URL**: `/static/`
* **Directory**: `/home/YOUR_USERNAME/YOUR_REPO_NAME/staticfiles`

---

## Step 6: Configure the PythonAnywhere WSGI file
1. Under the **Web** tab, in the **Code** section, click the link to edit the **WSGI configuration file** (it looks like `/var/www/yourusername_pythonanywhere_com_wsgi.py`).
2. Delete everything inside it and replace it with the following configuration:

```python
import os
import sys

# Add your project directory to the sys.path
path = '/home/YOUR_USERNAME/YOUR_REPO_NAME'
if path not in sys.path:
    sys.path.append(path)

# Set the Django settings module
os.environ['DJANGO_SETTINGS_MODULE'] = 'chatbot_project.settings'

# Start the WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```
3. Click **Save** at the top right.

---

## Step 7: Reload and Test!
1. Go back to the **Web** tab.
2. Click the green **Reload** button at the top.
3. Open your site at `https://YOUR_USERNAME.pythonanywhere.com` to see the running chatbot!
