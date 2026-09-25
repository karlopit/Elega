# Elega QA tests

This folder contains local API and Selenium smoke tests for the Elega frontend and backend.

## Setup

From the repository root:

```powershell
py -m venv qa\.venv
.\qa\.venv\Scripts\Activate.ps1
pip install -r qa\requirements.txt
Copy-Item qa\.env.example qa\.env
```

Start the application in separate terminals:

```powershell
cd backend\api
uvicorn main:app --port 8000
```

```powershell
cd frontend\app
npm run dev
```

Run the API tests:

```powershell
python -m pytest -c qa\pytest.ini qa\tests\api -q
```

Run the browser smoke tests with a visible Chrome window:

```powershell
python -m pytest -c qa\pytest.ini qa\tests\ui -q
```

Run Selenium headlessly:

```powershell
$env:HEADLESS = "true"
python -m pytest -c qa\pytest.ini qa\tests\ui -q --html=qa\reports\ui-report.html --self-contained-html
```

The browser tests use the local URLs by default. Override `API_URL` and `BASE_URL` in `qa/.env` for staging. Use a dedicated QA Supabase project and QA accounts before running authenticated tests.
