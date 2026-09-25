import pytest
from selenium.webdriver.common.by import By

from qa.pages.account_page import AccountPage


pytestmark = [pytest.mark.ui, pytest.mark.smoke]


def test_account_form_shows_client_validation_error(browser, base_url):
    account = AccountPage(browser, base_url).open()
    account.wait_until_loaded()
    account.submit("invalid-email", "short")

    error = browser.find_element(By.XPATH, "//p[contains(., 'valid email')]")
    assert error.is_displayed()
