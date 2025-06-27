
import { execSync } from 'child_process';

const DOCKER_CONTAINER_NAME = 'airtime-queen-db-test-e2e';
const ANVIL_PORT = 8547;

try {
  // 1. Clean up previous runs
  console.log('Cleaning up previous test runs...');
  execSync(`kill -9 $(lsof -t -i:${ANVIL_PORT}) || true`);
  execSync(`docker rm -f ${DOCKER_CONTAINER_NAME} || true`);

  // 2. Start services
  console.log('Starting Docker container...');
  execSync(`docker run --name ${DOCKER_CONTAINER_NAME} -e POSTGRES_DB=airtime_queen -e POSTGRES_USER=steph -e POSTGRES_PASSWORD=secure_password -d -p 5432:5432 postgres`);
  console.log('Waiting for database to be ready...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 3. Run migrations
  console.log('Running database migrations...');
  execSync('DATABASE_URL=postgres://steph:secure_password@localhost:5432/airtime_queen bun run src/db/migrate.ts', { stdio: 'inherit' });


  // 4. Run the e2e test
  console.log('Running end-to-end tests...');
  execSync('bun test tests/e2e.test.ts', { stdio: 'inherit' });

} catch (error) {
  console.error('E2E test run failed:', error);
  process.exit(1);
} finally {
  // 5. Clean up
  console.log('Cleaning up test environment...');
  execSync(`docker stop ${DOCKER_CONTAINER_NAME}`);
  execSync(`docker rm -f ${DOCKER_CONTAINER_NAME}`);
  console.log('Cleanup complete.');
}
