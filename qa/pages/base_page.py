from selenium.webdriver.support import expected_conditions as expected
from selenium.webdriver.support.ui import WebDriverWait


class BasePage:
    """Shared Selenium helpers for Elega page objects."""

    def __init__(self, driver, base_url: str, timeout: int = 15):
        self.driver = driver
        self.base_url = base_url
        self.wait = WebDriverWait(driver, timeout)

    def open(self, path: str):
        """Navigate to a frontend route."""
        self.driver.get(f"{self.base_url}{path}")
        return self

    def wait_for_visible(self, locator):
        """Wait until an element is visible and return it."""
        return self.wait.until(expected.visibility_of_element_located(locator))

    def wait_for_clickable(self, locator):
        """Wait until an element can be clicked and return it."""
        return self.wait.until(expected.element_to_be_clickable(locator))
