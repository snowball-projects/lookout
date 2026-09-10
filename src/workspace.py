"""Pure, deterministic holdings valuation and an adapter to Moneyprinter v1."""
from __future__ import annotations

from collections import defaultdict
from copy import deepcopy
from datetime import date, datetime, timezone
from decimal import Decimal, localcontext
import re

MAX_ROWS = 10_000
ID = re.compile(r"^[a-z][a-z0-9._-]*:[A-Za-z0-9][A-Za-z0-9._/-]*$")
DECIMAL = re.compile(r"^(0|[1-9][0-9]*)(\.[0-9]+)?$")
KINDS = {"security", "fund", "cash", "derivative", "unknown"}


class ContractError(ValueError):
    """An input does not meet the versioned workspace contract."""


def exact(value, fields, path):
    if not isinstance(value, dict) or set(value) != set(fields.split()):
        raise ContractError(f"{path}: expected exactly {fields}")


def text(value, path):
    if not isinstance(value, str) or not value.strip() or value != value.strip() or len(value) > 512:
        raise ContractError(f"{path}: expected trimmed text of 1–512 characters")
    return value


def identifier(value, path):
    if not ID.fullmatch(text(value, path)):
        raise ContractError(f"{path}: expected scheme-qualified identifier")
    return value


def decimal(value, path):
    if not isinstance(value, str) or len(value) > 48 or not DECIMAL.fullmatch(value):
        raise ContractError(f"{path}: expected nonnegative plain decimal string")
    number = Decimal(value)
    if len(number.as_tuple().digits) > 28 or max(-number.as_tuple().exponent, 0) > 18:
        raise ContractError(f"{path}: maximum 28 digits and 18 decimal places")
    return number


def timestamp(value, path):
    text(value, path)
    try:
        # A deliberately narrow, portable format; no timezone inference.
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})", value):
            raise ValueError()
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if result.utcoffset() is None:
            raise ValueError()
        return result.astimezone(timezone.utc)
    except ValueError as error:
        raise ContractError(f"{path}: expected valid offset-aware timestamp") from error


def source(value, path):
    exact(value, "name reference retrieved_at", path)
    text(value["name"], path + ".name")
    text(value["reference"], path + ".reference")
    return timestamp(value["retrieved_at"], path + ".retrieved_at")


def rows(value, path):
    if not isinstance(value, list) or len(value) > MAX_ROWS:
        raise ContractError(f"{path}: expected array of at most {MAX_ROWS} rows")
    return value


def rendered(value):
    result = format(value, "f")
    return result.rstrip("0").rstrip(".") if "." in result else result


def prepare_workspace(bundle):
    """Return account lineage, known valuation and a strictly complete exposure input.

    Dates describe the data actually supplied; this is not a point-in-time
    backtest admission check. Provider retrieval can postdate the valuation day.
    """
    bundle = deepcopy(bundle)
    exact(bundle, "schema_version valuation_as_of currency accounts instruments holdings quotes snapshots", "bundle")
    if bundle["schema_version"] != "lookout.workspace/1":
        raise ContractError("Unsupported schema_version")
    currency = bundle["currency"]
    if not isinstance(currency, str) or not re.fullmatch(r"[A-Z]{3}", currency):
        raise ContractError("currency: expected three uppercase letters")
    try:
        day = date.fromisoformat(bundle["valuation_as_of"])
        if day.isoformat() != bundle["valuation_as_of"]:
            raise ValueError()
    except (ValueError, TypeError) as error:
        raise ContractError("valuation_as_of: expected YYYY-MM-DD") from error
    if not isinstance(bundle["snapshots"], list) or len(bundle["snapshots"]) > MAX_ROWS:
        raise ContractError("snapshots: expected bounded array; engine validates its contents")
    accounts = {}
    for item in rows(bundle["accounts"], "accounts"):
        exact(item, "id label", "account")
        identifier(item["id"], "account.id")
        text(item["label"], "account.label")
        if item["id"] in accounts:
            raise ContractError("Duplicate account id")
        accounts[item["id"]] = item
    instruments = {}
    for item in rows(bundle["instruments"], "instruments"):
        exact(item, "id label kind", "instrument")
        identifier(item["id"], "instrument.id")
        text(item["label"], "instrument.label")
        if not isinstance(item["kind"], str) or item["kind"] not in KINDS:
            raise ContractError("Unsupported instrument kind")
        if item["id"] in instruments:
            raise ContractError("Duplicate instrument id")
        instruments[item["id"]] = item
    quotes = {}
    for item in rows(bundle["quotes"], "quotes"):
        exact(item, "instrument_id currency price as_of source", "quote")
        identifier(item["instrument_id"], "quote.instrument_id")
        if item["instrument_id"] not in instruments:
            raise ContractError("Quote references unknown instrument")
        if item["currency"] != currency:
            raise ContractError("Quote currency mismatch; FX conversion is not implemented")
        decimal(item["price"], "quote.price")
        stamp = timestamp(item["as_of"], "quote.as_of")
        if stamp.date() > day:
            raise ContractError("Quote postdates valuation day in UTC")
        if source(item["source"], "quote.source") < stamp:
            raise ContractError("Quote source retrieval predates observation")
        if item["instrument_id"] in quotes:
            raise ContractError("Duplicate quote; select one explicitly")
        quotes[item["instrument_id"]] = item
    seen, valued, missing = set(), [], []
    # Large enough for bounded 28-digit inputs × products × 10,000-row sums.
    with localcontext() as ctx:
        ctx.prec = 80
        totals = defaultdict(Decimal)
        account_totals = {key: Decimal(0) for key in accounts}
        known_total = Decimal(0)
        for item in rows(bundle["holdings"], "holdings"):
            exact(item, "account_id instrument_id quantity as_of source", "holding")
            aid = identifier(item["account_id"], "holding.account_id")
            iid = identifier(item["instrument_id"], "holding.instrument_id")
            if aid not in accounts or iid not in instruments:
                raise ContractError("Holding references unknown account or instrument")
            key = (aid, iid)
            if key in seen:
                raise ContractError("Duplicate account/instrument holding; normalize lots explicitly")
            seen.add(key)
            quantity = decimal(item["quantity"], "holding.quantity")
            stamp = timestamp(item["as_of"], "holding.as_of")
            if stamp.date() > day:
                raise ContractError("Holding postdates valuation day in UTC")
            if source(item["source"], "holding.source") < stamp:
                raise ContractError("Holding source retrieval predates observation")
            quote = quotes.get(iid)
            value = quantity * Decimal(quote["price"]) if quote else None
            record = {**item, "market_value": rendered(value) if value is not None else None,
                      "quote": quote, "valuation_status": "priced" if quote else "missing_quote"}
            valued.append(record)
            if value is None:
                missing.append({"account_id": aid, "instrument_id": iid, "reason": "missing_quote"})
            else:
                totals[iid] += value
                account_totals[aid] += value
                known_total += value
        positions = [{"instrument_id": iid, "kind": instruments[iid]["kind"],
                      "market_value": rendered(value)} for iid, value in sorted(totals.items())]
    # Moneyprinter allows at most 8 money places and 28 digits. Never silently round.
    unsupported = [p["instrument_id"] for p in positions
                   if len(Decimal(p["market_value"]).as_tuple().digits) > 28
                   or max(-Decimal(p["market_value"]).as_tuple().exponent, 0) > 8]
    complete = not missing
    ready = complete and not unsupported and bool(valued)
    return {"schema_version": "lookout.workspace-result/1", "currency": currency,
            "valuation_as_of": day.isoformat(), "holdings": sorted(valued, key=lambda r: (r["account_id"], r["instrument_id"])),
            "known_market_value": rendered(known_total), "valuation_complete": complete,
            "unpriced": sorted(missing, key=lambda r: (r["account_id"], r["instrument_id"])), "account_known_values": {a: rendered(v) for a, v in sorted(account_totals.items())},
            "exposure_blockers": {"missing_quotes": len(missing), "unsupported_precision": unsupported, "empty_portfolio": not valued},
            "exposure_input": {"schema_version": "1", "portfolio": {"currency": currency,
                "valuation_as_of": day.isoformat(), "positions": positions},
                "snapshots": bundle["snapshots"], "options": {"max_depth": 8, "stale_after_days": 90}} if ready else None}
