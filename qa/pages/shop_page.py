from selenium.webdriver.common.by import By

from qa.pages.base_page import BasePage


class ShopPage(BasePage):
    """Page object for the public product catalog."""

    heading = (By.XPATH, "//h1[contains(., 'All available pieces')]")
    add_to_cart_button = (By.XPATH, "//button[contains(normalize-space(), 'Add to cart')]")

    def open(self):
        return super().open("/shop")

    def wait_until_loaded(self):
        self.wait_for_visible(self.heading)

    def has_products(self) -> bool:
        return bool(self.driver.find_elements(*self.add_to_cart_button))

    def add_first_product_to_cart(self):
        self.wait_for_clickable(self.add_to_cart_button).click()
