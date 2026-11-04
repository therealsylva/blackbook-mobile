#!/usr/bin/env python3
"""Check that the release APK actually embeds the current public auth project."""
import argparse
import json
import re
import zipfile
from pathlib import Path


def verify_bundle(bundle, connection):
    for key in ('authUrl', 'publishableKey'):
        if connection[key].encode() not in bundle:
            raise ValueError(f'APK bundle is missing the expected {key}')
    urls = set(re.findall(rb'https://[a-z]{20}\.supabase\.co', bundle))
    if urls != {connection['authUrl'].encode()}:
        raise ValueError('APK bundle contains a different Supabase project URL')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('apk', type=Path)
    args = parser.parse_args()
    connection = json.loads((Path(__file__).resolve().parents[1] / 'src/lib/public-connection.json').read_text())
    with zipfile.ZipFile(args.apk) as apk:
        verify_bundle(apk.read('assets/index.android.bundle'), connection)
    print('APK bundle verified: current Supabase project and matching publishable key.')


if __name__ == '__main__':
    main()
