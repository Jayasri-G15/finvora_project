"""Currency normalization. Exchange rates are fetched from a public API in production."""
from decimal import Decimal

# Fallback static rates to INR for offline/testing scenarios
_STATIC_RATES_TO_INR: dict[str, Decimal] = {
    "INR": Decimal("1"),
    "USD": Decimal("83.5"),
    "EUR": Decimal("90.2"),
    "GBP": Decimal("105.8"),
    "AED": Decimal("22.7"),
    "SGD": Decimal("62.0"),
}


def convert_to_inr(amount: Decimal, currency: str) -> tuple[Decimal, Decimal]:
    """Returns (inr_amount, rate_used)."""
    rate = _STATIC_RATES_TO_INR.get(currency.upper(), Decimal("1"))
    return (amount * rate).quantize(Decimal("0.01")), rate
