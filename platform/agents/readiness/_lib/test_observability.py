"""Offline actual-executor regressions for positive counter sample evidence."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

PATH = Path(__file__).resolve().parent.parent / 'readiness-observability' / 'executor.py'
SPEC = importlib.util.spec_from_file_location('readiness_observability_under_test', PATH)
observability = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(observability)


class CounterSamplesTest(unittest.TestCase):
    def observe(self, body, status=200):
        with patch.object(observability, 'OTEL_COLLECTOR_URL', None), \
                patch.object(observability, '_get', side_effect=[(200, ''), (status, body)]):
            return observability.check_flagship('https://fixture.invalid')

    def test_comments_do_not_prove_counters(self):
        body = '\n'.join(f'# HELP {name} synthetic counter\n# TYPE {name} counter'
                         for name in observability.REQUIRED_COUNTERS) + '\n'
        self.assertFalse(any(self.observe(body)['required_counters'].values()))

    def test_lookalike_sample_names_do_not_prove_counters(self):
        for prefix, suffix in [('other_', ''), ('', '_bucket'), ('', '_shadow')]:
            with self.subTest(prefix=prefix, suffix=suffix):
                body = ''.join(f'{prefix}{name}{suffix} 1\n' for name in observability.REQUIRED_COUNTERS)
                self.assertFalse(any(self.observe(body)['required_counters'].values()))

    def test_label_values_and_arbitrary_text_do_not_prove_counters(self):
        for template in ['other{{description="{name}"}} 1\n', 'message: {name}\n',
                         '<p>{name}</p>\n']:
            with self.subTest(template=template):
                body = ''.join(template.format(name=name) for name in observability.REQUIRED_COUNTERS)
                self.assertFalse(any(self.observe(body)['required_counters'].values()))

    def test_complete_plain_and_labelled_samples_are_observed(self):
        for template in ['{name} 0\n', '  {name}{{}}\t2.5e1 1700000000000\t\n',
                         '{name}{{code="ok",route="a,b}}",}} +4\n',
                         '{{"{name}","route.name"="a,b",}} 1\n']:
            with self.subTest(template=template):
                body = ''.join(template.format(name=name) for name in observability.REQUIRED_COUNTERS)
                self.assertTrue(all(self.observe(body)['required_counters'].values()))

    def test_malformed_or_unusable_values_provide_no_positive_evidence(self):
        for value in ['', 'not_a_number', 'NaN', '+Inf', '-Inf', '1e999', '-1',
                      '1 extra', '1 9223372036854775808']:
            with self.subTest(value=value):
                body = ''.join(f'{name} {value}\n' for name in observability.REQUIRED_COUNTERS)
                self.assertFalse(any(self.observe(body)['required_counters'].values()))

    def test_malformed_labels_provide_no_positive_evidence(self):
        for labels in ['{x=no_quotes}', '{x="one",x="two"}', '{x="one",,,}',
                       '{__name__="other"}', '{x="bad\\q"}']:
            with self.subTest(labels=labels):
                body = ''.join(f'{name}{labels} 1\n' for name in observability.REQUIRED_COUNTERS)
                self.assertFalse(any(self.observe(body)['required_counters'].values()))

    def test_unterminated_final_line_does_not_prove_counter(self):
        name = observability.REQUIRED_COUNTERS[0]
        self.assertFalse(self.observe(f'{name} 1')['required_counters'][name])
        self.assertTrue(self.observe(f'{name} 1\n')['required_counters'][name])

    def test_only_lf_separates_metric_samples(self):
        for separator in ['\r', '\v', '\f', '\x85', '\u2028', '\u2029']:
            with self.subTest(separator=repr(separator)):
                body = ''.join(f'prose{separator}{name} 1\n'
                               for name in observability.REQUIRED_COUNTERS)
                self.assertFalse(any(self.observe(body)['required_counters'].values()))

    def test_unicode_separators_inside_label_values_are_preserved(self):
        for separator in ['\u2028', '\u2029']:
            with self.subTest(separator=repr(separator)):
                body = ''.join(f'{name}{{label="alpha{separator}beta"}} 1\n'
                               for name in observability.REQUIRED_COUNTERS)
                self.assertTrue(all(self.observe(body)['required_counters'].values()))

    def test_extremely_long_timestamp_does_not_abort_probe(self):
        name = observability.REQUIRED_COUNTERS[0]
        result = self.observe(f'{name} 1 {"9" * 5000}\n')
        self.assertFalse(result['required_counters'][name])

    def test_duplicate_quoted_and_unquoted_label_names_are_rejected(self):
        name = observability.REQUIRED_COUNTERS[0]
        self.assertFalse(self.observe(f'{name}{{x="one","x"="two"}} 1\n')['required_counters'][name])

    def test_escaped_label_values_are_accepted(self):
        name = observability.REQUIRED_COUNTERS[0]
        body = name + r'{path="a\\b",line="a\nb",quote="a\"b"} 1' + '\n'
        self.assertTrue(self.observe(body)['required_counters'][name])

    def test_non_success_metrics_response_does_not_prove_counters(self):
        body = ''.join(f'{name} 1\n' for name in observability.REQUIRED_COUNTERS)
        for status in (0, 404, 500):
            with self.subTest(status=status):
                self.assertFalse(any(self.observe(body, status)['required_counters'].values()))

    def test_valid_samples_do_not_invent_trace_continuity(self):
        body = ''.join(f'{name} 1\n' for name in observability.REQUIRED_COUNTERS)
        self.assertIsNone(self.observe(body)['wire_d_propagated'])


if __name__ == '__main__':
    unittest.main()
