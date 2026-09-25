import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as expected

from qa.pages.account_page import AccountPage
from qa.pages.cart_page import CartPage
from qa.pages.shop_page import ShopPage


pytestmark = [pytest.mark.ui, pytest.mark.smoke]


def test_homepage_loads(browser, base_url):
    browser.get(base_url)

    heading = browser.find_element(By.XPATH, "//h1[contains(normalize-space(), 'Elega')]")
    assert heading.is_displayed()


def test_account_page_loads(browser, base_url):
    account = AccountPage(browser, base_url).open()

    account.wait_until_loaded()
    assert "Account" in browser.find_element(By.TAG_NAME, "body").text


def test_shop_page_loads(browser, base_url):
    shop = ShopPage(browser, base_url).open()

    shop.wait_until_loaded()
    assert browser.find_element(*shop.heading).is_displayed()


def test_guest_can_add_a_product_to_the_cart(browser, base_url):
    shop = ShopPage(browser, base_url).open()
    shop.wait_until_loaded()

    if not shop.has_products():
        pytest.skip("No active QA product is available; seed the QA catalog first.")

    shop.add_first_product_to_cart()
    cart = CartPage(browser, base_url).open()
    cart.wait_until_loaded()

    assert "Your fitting room is empty" not in browser.find_element(By.TAG_NAME, "body").text
