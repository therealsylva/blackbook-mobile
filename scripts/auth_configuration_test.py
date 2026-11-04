import contextlib
import io
import json
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch

MODULE = runpy.run_path(str(Path(__file__).with_name('configure-email-codes.py')))
PROJECT = 'aubzkokxxhjdkfqgpjfn'

class AuthConfigTest(unittest.TestCase):
    def run_setup(self, current, dry_run=False):
        calls = []
        def request(req, timeout):
            calls.append(req)
            if req.method == 'PATCH':
                current.update(json.loads(req.data))
            response = io.BytesIO(json.dumps(current).encode())
            return response
        argv = ['configure-email-codes.py', '--project-ref', PROJECT]
        if dry_run:
            argv.append('--dry-run')
        with patch('sys.argv', argv), patch.dict('os.environ', {'SUPABASE_ACCESS_TOKEN':'fixture-token'}, clear=True), patch('urllib.request.urlopen', request), contextlib.redirect_stdout(io.StringIO()):
            MODULE['main']()
        return calls

    def test_smtp_is_required_before_any_mutation(self):
        calls=[]
        def request(req, timeout):
            calls.append(req.method)
            return io.BytesIO(b'{}')
        with patch('sys.argv',['setup','--project-ref',PROJECT]), patch.dict('os.environ', {'SUPABASE_ACCESS_TOKEN':'fixture-token'},clear=True), patch('urllib.request.urlopen',request), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(SystemExit,'Custom SMTP is not configured'):
                MODULE['main']()
        self.assertEqual(calls,['GET'])

    def test_codes_and_urls_do_not_modify_smtp_or_rate_limits(self):
        current={'smtp_host':'smtp.example.test','smtp_pass':'private-fixture','rate_limit_email_sent':30,'uri_allow_list':'https://existing.example/callback'}
        import os
        previous=os.getcwd()
        with tempfile.TemporaryDirectory() as folder:
            try:
                os.chdir(folder)
                calls=self.run_setup(current)
                backups=list(Path(folder).glob('blackbook-auth-email-backup-*.json'))
                self.assertEqual(len(backups),1)
                self.assertEqual(backups[0].stat().st_mode & 0o777,0o600)
                self.assertNotIn('private-fixture',backups[0].read_text())
            finally:
                os.chdir(previous)
        self.assertEqual([r.method for r in calls],['GET','PATCH','GET'])
        self.assertTrue(all(f'/projects/{PROJECT}/config/auth' in r.full_url for r in calls))
        self.assertEqual(current['mailer_otp_length'],8)
        self.assertEqual(current['smtp_pass'],'private-fixture')
        self.assertEqual(current['rate_limit_email_sent'],30)
        self.assertIn('https://existing.example/callback',current['uri_allow_list'])
        for template in MODULE['TEMPLATES']:
            self.assertIn('{{ .Token }}',current[template])
            self.assertNotIn('ConfirmationURL',current[template])

    def test_dry_run_does_not_patch(self):
        calls=self.run_setup({'smtp_host':'smtp.example.test'},dry_run=True)
        self.assertEqual([r.method for r in calls],['GET'])

if __name__ == '__main__':
    unittest.main()
