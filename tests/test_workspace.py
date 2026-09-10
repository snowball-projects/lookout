import copy
import json
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from workspace import ContractError, prepare_workspace


class WorkspaceTests(unittest.TestCase):
    def setUp(self):
        self.bundle = json.loads((Path(__file__).resolve().parents[1] / 'examples/holdings.json').read_text())

    def test_account_lineage_survives_engine_aggregation(self):
        result = prepare_workspace(self.bundle)
        self.assertEqual(result['known_market_value'], '1300')
        self.assertEqual(result['account_known_values'], {'account:brokerage':'1100', 'account:wallet':'200'})
        self.assertEqual(len(result['holdings']), 4)
        positions = result['exposure_input']['portfolio']['positions']
        self.assertEqual(len(positions), 3)
        self.assertEqual(next(p['market_value'] for p in positions if p['instrument_id']=='ticker:ACME'), '200')

    def test_missing_price_is_unknown_and_blocks_full_exposure(self):
        self.bundle['quotes'] = self.bundle['quotes'][:1]
        result = prepare_workspace(self.bundle)
        self.assertFalse(result['valuation_complete'])
        self.assertEqual(result['known_market_value'], '1000')
        self.assertEqual(len(result['unpriced']), 3)
        self.assertIsNone(result['exposure_input'])
        self.assertIsNone(next(r['market_value'] for r in result['holdings'] if r['instrument_id']=='cash:USD'))

    def test_cash_requires_explicit_quote_too(self):
        self.bundle['quotes'].pop()
        self.assertIsNone(prepare_workspace(self.bundle)['exposure_input'])

    def test_decimal_multiplication_is_exact(self):
        self.bundle['quotes'][0]['price'] = '0.2'
        self.bundle['holdings'][0]['quantity'] = '0.1'
        self.assertEqual(prepare_workspace(self.bundle)['known_market_value'], '300.02')

    def test_unrepresentable_precision_is_not_silently_rounded(self):
        self.bundle['quotes'][0]['price'] = '0.000000001'
        self.bundle['holdings'][0]['quantity'] = '1'
        result = prepare_workspace(self.bundle)
        self.assertEqual(result['known_market_value'], '300.000000001')
        self.assertIsNone(result['exposure_input'])
        self.assertEqual(result['exposure_blockers']['unsupported_precision'], ['ticker:FUND_ALPHA'])

    def test_invalid_decimal_forms(self):
        for value in [1.0, '-1', 'NaN', 'Infinity', '1e4', '01', True]:
            with self.subTest(value=value):
                bundle = copy.deepcopy(self.bundle)
                bundle['holdings'][0]['quantity'] = value
                with self.assertRaises(ContractError): prepare_workspace(bundle)

    def test_duplicates_and_dangling_refs(self):
        for field in ['holdings', 'quotes', 'accounts', 'instruments']:
            with self.subTest(field=field):
                bundle=copy.deepcopy(self.bundle);bundle[field].append(bundle[field][0])
                with self.assertRaises(ContractError): prepare_workspace(bundle)
        self.bundle['holdings'][0]['account_id']='account:missing'
        with self.assertRaises(ContractError): prepare_workspace(self.bundle)

    def test_future_holdings_or_quotes_rejected(self):
        for field in ['holdings','quotes']:
            with self.subTest(field=field):
                bundle=copy.deepcopy(self.bundle);bundle[field][0]['as_of']='2026-08-28T00:00:00Z'
                with self.assertRaises(ContractError):prepare_workspace(bundle)

    def test_invalid_timezone_calendar_and_retrieval(self):
        for value in ['2026-08-27T12:00:00','2026-02-30T00:00:00Z','2026-08-27T24:00:00Z']:
            bundle=copy.deepcopy(self.bundle);bundle['quotes'][0]['as_of']=value
            with self.assertRaises(ContractError):prepare_workspace(bundle)
        self.bundle['quotes'][0]['source']['retrieved_at']='2026-08-26T00:00:00Z'
        with self.assertRaises(ContractError):prepare_workspace(self.bundle)

    def test_currency_mismatch_requires_explicit_fx_work(self):
        self.bundle['quotes'][0]['currency']='EUR'
        with self.assertRaises(ContractError):prepare_workspace(self.bundle)

    def test_inputs_and_results_do_not_alias(self):
        original=copy.deepcopy(self.bundle)
        result=prepare_workspace(self.bundle)
        result['exposure_input']['snapshots'][0]['source']['name']='changed'
        result['holdings'][0]['source']['name']='changed'
        self.assertEqual(self.bundle,original)

    def test_reordering_inputs_keeps_results_identical(self):
        self.bundle['quotes'].pop()
        result=prepare_workspace(self.bundle)
        for field in ['holdings','quotes','accounts','instruments']:self.bundle[field].reverse()
        self.assertEqual(result,prepare_workspace(self.bundle))

    def test_schema_unknown_fields_and_malformed_identifiers(self):
        self.bundle['credentials']='not permitted'
        with self.assertRaises(ContractError):prepare_workspace(self.bundle)
        del self.bundle['credentials']
        self.bundle['holdings'][0]['account_id']=[]
        with self.assertRaises(ContractError):prepare_workspace(self.bundle)

    def test_empty_portfolio_has_no_engine_input(self):
        self.bundle['holdings']=[]
        result=prepare_workspace(self.bundle)
        self.assertIsNone(result['exposure_input'])
        self.assertTrue(result['exposure_blockers']['empty_portfolio'])

    def test_zero_is_a_valid_known_valuation(self):
        self.bundle['quotes'][0]['price']='0'
        result=prepare_workspace(self.bundle)
        self.assertTrue(result['valuation_complete'])
        self.assertEqual(result['known_market_value'],'300')


if __name__=='__main__':unittest.main()
