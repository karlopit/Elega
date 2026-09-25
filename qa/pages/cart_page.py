from selenium.webdriver.common.by import By

from qa.pages.base_page import BasePage


class CartPage(BasePage):
    """Page object for the customer cart."""

    heading = (By.XPATH, "//h1[contains(., 'Your selections')]")

    def open(self):
        return super().open("/cart")

    def wait_until_loaded(self):
        self.wait_for_visible(self.heading)
