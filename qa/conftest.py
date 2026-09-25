import os
from pathlib import Path
import sys

import pytest
import requests
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


load_dotenv(Path(__file__).with_name(".env"))

REPOSITORY_ROOT = Path(__file__).parent.parent
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))


@pytest.fixture(scope="session")
def base_url() -> str:
    """Return the frontend URL under test."""
    return os.getenv("BASE_URL", "http://localhost:3000").rstrip("/")


@pytest.fixture(scope="session")
def api_url() -> str:
    """Return the backend URL under test."""
    return os.getenv("API_URL", "http://localhost:8000").rstrip("/")


@pytest.fixture
def http_client():
    """Provide a short-lived HTTP client for API tests."""
    client = requests.Session()
    try:
        yield client
    finally:
        client.close()


@pytest.fixture
def browser(request):
    """Create a Chrome WebDriver and save a screenshot when a UI test fails."""
    options = Options()
    if os.getenv("HEADLESS", "false").lower() == "true":
        options.add_argument("--headless=new")
    if os.getenv("CI", "false").lower() == "true":
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,1000")

    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(0)

    try:
        yield driver
    finally:
        report = getattr(request.node, "rep_call", None)
        if report and report.failed:
            report_dir = Path(__file__).with_name("reports")
            report_dir.mkdir(parents=True, exist_ok=True)
            screenshot_path = report_dir / f"{request.node.name}.png"
            driver.save_screenshot(str(screenshot_path))
        driver.quit()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Expose the call report to the browser fixture for failure screenshots."""
    outcome = yield
    report = outcome.get_result()
    if report.when == "call":
        setattr(item, "rep_call", report)
