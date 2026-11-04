from pathlib import Path
import runpy
import unittest

verify = runpy.run_path(str(Path(__file__).with_name('verify-apk-connection.py')))['verify_bundle']
connection = {'authUrl':'https://aaaaaaaaaaaaaaaaaaaa.supabase.co','publishableKey':'sb_publishable_fixture'}

class ApkConnectionTest(unittest.TestCase):
    def test_current_pair_is_required(self):
        good = (connection['authUrl']+' '+connection['publishableKey']).encode()
        verify(good, connection)
        for invalid in [b'empty bundle', good+b' https://bbbbbbbbbbbbbbbbbbbb.supabase.co', connection['authUrl'].encode()]:
            with self.assertRaises(ValueError): verify(invalid, connection)

if __name__ == '__main__': unittest.main()
