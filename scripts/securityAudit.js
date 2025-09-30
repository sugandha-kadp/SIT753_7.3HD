const { execSync } = require('child_process');

function runAudit() {
  try {
    const output = execSync('npm audit --json', { stdio: 'pipe' }).toString();
    return { stdout: output, exitCode: 0 };
  } catch (error) {
    if (error.stdout) {
      return { stdout: error.stdout.toString(), exitCode: error.status ?? 1 };
    }
    throw error;
  }
}

function main() {
  const { stdout, exitCode } = runAudit();
  let report;
  try {
    report = JSON.parse(stdout);
  } catch (err) {
    console.error('Failed to parse npm audit output:', err.message);
    console.error(stdout);
    process.exit(1);
  }

  const vulnerabilities = report.vulnerabilities || {};
  const findings = Object.entries(vulnerabilities).flatMap(([name, info]) => {
    if (!info || !info.via) return [];
    return info.via.map((viaEntry) => ({
      package: name,
      title: viaEntry.title || 'Unknown vulnerability',
      severity: viaEntry.severity || info.severity || 'unknown',
      url: viaEntry.url,
      fixAvailable: info.fixAvailable,
      direct: info.isDirect,
    }));
  });

  if (!findings.length) {
    console.log('Security audit passed: no vulnerabilities found.');
    process.exit(0);
  }

  console.error('Security audit found vulnerabilities:');
  findings.forEach((finding, index) => {
    console.error(`\n${index + 1}. Package: ${finding.package}`);
    console.error(`   Issue: ${finding.title}`);
    console.error(`   Severity: ${finding.severity}`);
    console.error(`   Direct dependency: ${finding.direct ? 'yes' : 'no'}`);
    if (finding.fixAvailable) {
      console.error(`   Fix available: ${JSON.stringify(finding.fixAvailable)}`);
    } else {
      console.error('   Fix available: none');
    }
    if (finding.url) {
      console.error(`   More info: ${finding.url}`);
    }
  });

  console.error('\nFailing the build because security vulnerabilities were detected.');
  process.exit(exitCode || 1);
}

main();
