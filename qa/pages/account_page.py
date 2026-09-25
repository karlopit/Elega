from selenium.webdriver.common.by import By

from qa.pages.base_page import BasePage


class AccountPage(BasePage):
    """Page object for registration and login."""

    email_input = (By.CSS_SELECTOR, "input[type='email']")
    password_input = (By.CSS_SELECTOR, "input[type='password']")
    submit_button = (By.CSS_SELECTOR, "button[type='submit']")
    heading = (By.XPATH, "//h1[contains(., 'Keep your fitting room ready')]")

    def open(self):
        return super().open("/account")

    def wait_until_loaded(self):
        self.wait_for_visible(self.heading)
        self.wait_for_visible(self.email_input)
        self.wait_for_visible(self.password_input)

    def submit(self, email: str, password: str):
        self.wait_for_visible(self.email_input).send_keys(email)
        self.wait_for_visible(self.password_input).send_keys(password)
        self.wait_for_clickable(self.submit_button).click()
