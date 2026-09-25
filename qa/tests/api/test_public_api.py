import pytest


pytestmark = pytest.mark.api


def test_health_endpoint(http_client, api_url):
    response = http_client.get(f"{api_url}/health", timeout=10)

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_public_products_endpoint_returns_a_list(http_client, api_url):
    response = http_client.get(f"{api_url}/products", timeout=15)

    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)

    if products:
        assert {"id", "name", "price", "currency", "stock_quantity"}.issubset(products[0])


def test_login_rejects_invalid_request_shape(http_client, api_url):
    response = http_client.post(
        f"{api_url}/auth/login",
        json={"email": "not-an-email", "password": "short"},
        timeout=10,
    )

    assert response.status_code == 422
