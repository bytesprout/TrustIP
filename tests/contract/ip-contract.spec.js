const fs = require('fs');
const path = require('path');
const assert = require('assert');

function readFixture(name) {
  const filePath = path.join(__dirname, '..', 'fixtures', name);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hasPath(object, dotPath) {
  return dotPath.split('.').reduce((current, key) => {
    if (current && Object.prototype.hasOwnProperty.call(current, key)) {
      return current[key];
    }
    return undefined;
  }, object) !== undefined;
}

function run() {
  const contracts = [
    {
      name: '/api/v1/ip/basic',
      fixture: readFixture('ip-contract-basic.json'),
      requiredPaths: [
        'success',
        'timestamp',
        'ip.address',
        'ip.version',
        'location.countryCode',
        'network.asn',
        'metadata.cacheHit',
        'metadata.lookupTimeMs',
      ],
    },
    {
      name: '/api/v1/ip/intelligence',
      fixture: readFixture('ip-contract-intelligence.json'),
      requiredPaths: [
        'success',
        'timestamp',
        'request.queryIp',
        'ip.address',
        'location.countryCode',
        'privacy.vpn',
        'metadata.cacheHit',
      ],
    },
    {
      name: '/api/v1/ip/trust-score',
      fixture: readFixture('ip-contract-trust-score.json'),
      requiredPaths: [
        'success',
        'ip',
        'trust.trustScore',
        'trust.riskScore',
        'trust.decision',
        'trust.signals.vpn',
      ],
    },
  ];

  contracts.forEach((contract) => {
    contract.requiredPaths.forEach((item) => {
      assert.strictEqual(
        hasPath(contract.fixture, item),
        true,
        `[contract] Missing field '${item}' in ${contract.name}`,
      );
    });
  });

  process.stdout.write('[contract] all IP API contracts validated\n');
}

run();
