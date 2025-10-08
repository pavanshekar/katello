const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Global setup for Playwright tests
 *
 * Loads Rails fixtures before all tests run
 * All rake/rails commands must run from Foreman directory with bundle exec
 */
module.exports = async function globalSetup() {
  console.log('\n Playwright global setup\n');

  try {
    // Commands must run from Foreman directory, not Katello
    const foremanDir = path.resolve(__dirname, '../../foreman');

    console.log('Loading Foreman fixtures...');
    // Load base Foreman fixtures (organizations, users, etc.)
    execSync('RAILS_ENV=test bundle exec rake db:fixtures:load', {
      stdio: 'inherit',
      cwd: foremanDir
    });

    console.log('Loading Katello fixtures...');

    // Exclude fixtures where tables don't exist or cause conflicts
    const excludedFixtures = [
      'hosts.yml',                        // Conflicts with Host module
      'katello_features.yml',             // Table doesn't exist
      'katello_gpg_keys.yml',             // Table doesn't exist
      'katello_smart_proxies.yml',        // Table doesn't exist
      'katello_smart_proxy_features.yml', // Table doesn't exist
      'katello_repositories.yml',         // Uses incompatible library_instance syntax
    ];

    // Build list of fixtures to load
    const katelloFixturesDir = path.resolve(__dirname, '../test/fixtures/models');
    const fixtureFiles = fs.readdirSync(katelloFixturesDir)
      .filter(file => file.endsWith('.yml') && !excludedFixtures.includes(file))
      .map(file => file.replace('.yml', ''));

    const fixturesList = fixtureFiles.join(',');

    // Load Katello plugin fixtures
    execSync(`RAILS_ENV=test bundle exec rake db:fixtures:load FIXTURES_PATH=../katello/test/fixtures/models FIXTURES=${fixturesList}`, {
      stdio: 'inherit',
      cwd: foremanDir
    });

    console.log('Creating admin user for tests...');
    // Create admin user (username: admin, password: changeme)
    const userScript = `
User.as_anonymous_admin do
  user = User.find_or_create_by(login: "admin") do |u|
    u.firstname = "Admin"
    u.lastname = "User"
    u.mail = "admin@example.com"
    u.admin = true
    u.auth_source_id = AuthSourceInternal.first.id
  end
  user.password = "changeme"
  user.save!
  puts "Admin user created/updated: #{user.login}"
end
`;

    const tmpFile = path.join(foremanDir, 'tmp', 'create_admin_user.rb');
    fs.writeFileSync(tmpFile, userScript);

    execSync(`RAILS_ENV=test bundle exec rails runner ${tmpFile}`, {
      stdio: 'inherit',
      cwd: foremanDir
    });

    fs.unlinkSync(tmpFile);

    console.log('\n Fixtures and admin user created successfully!\n');
  } catch (error) {
    console.error(' Failed to load fixtures:', error.message);
    process.exit(1);
  }
};
