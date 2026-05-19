from datetime import date


def fiscal_period(d: date) -> tuple[int, int]:
    """Returns (fiscal_year, fiscal_month) using April-March Indian fiscal year."""
    if d.month >= 4:
        return d.year, d.month
    return d.year - 1, d.month


def fiscal_year_range(fiscal_year: int) -> tuple[date, date]:
    return date(fiscal_year, 4, 1), date(fiscal_year + 1, 3, 31)
