# Airtime Queen Weekly Rewards Distribution

This project runs an automated weekly cron job to distribute rewards to users based on their average savings token balance (TWAB) from a vault contract. Rewards are dispersed as the vault’s savings token using the Disperse protocol on the Base network.

## Tech Stack

- **Runtime**: Bun with TypeScript
- **Blockchain SDK**: viem
- **Test Runner**: Vitest
- **Database**: Postgres with Kysely ORM
- **Local Test Chain**: Anvil

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gabrieltemtsen/airtime-queen-rewards
   cd airtime-queen-rewards
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root of the project and add the following variables:
   ```
   ANVIL_URL=http://localhost:8545
   RPC_URL=https://mainnet.base.org
   CHAIN_ID=8453
   DATABASE_URL=postgres://user:password@localhost:5432/airtime_queen
   PRIVATE_KEY=your_private_key
   REWARD_APY_BPS=500
   MULTICALL3=0xcA11bde05977b3631167028862bE2a173976CA11
   TWAB_CONTROLLER=0x7e63601F7e28C758Feccf8CDF02F6598694f44C6
   VAULT=0xCa69657fF5E4350BAE44F37524F2C6621Ff0735B
   ZARP=0xb755506531786c8ac63b756bab1ac387bacb0c04
   DISPERSE=0x7fca60de6d574548b4ce427ba53551e399ffb1f7
   ```

4. **Set up the database:**
   Make sure you have a Postgres database running and the `DATABASE_URL` is configured correctly in your `.env` file.
   Then, run the migration script to create the necessary tables (`users` and `job_runs`):
   ```bash
   bun run src/db/migrate.ts
   ```
   After running the migration, you may want to seed your `users` table with data for testing purposes.

## Running with Docker

To run the application using Docker Compose:

1.  **Ensure Docker is running:** Make sure your Docker daemon is active.

2.  **Create your `.env` file:** The `docker-compose.yml` expects environment variables to be set in a `.env` file in the project root. Copy the example variables from the `Setup` section.

3.  **Build and run the services:**
    ```bash
    docker-compose up --build
    ```
    This will:
    *   Build the `app` service (which includes installing dependencies and running database migrations).
    *   Start the `db` (PostgreSQL) service.
    *   Start the `app` service, which will execute the `weekly-distribute.ts` script.

    The `app` service is configured to restart on failure, and the `db` service is configured to always restart.

## Running the Cron Job

To run the weekly distribution script manually:

```bash
bun src/weekly-distribute.ts
```

### System Cron Configuration

To run the script automatically every week, you can add a new entry to your system's crontab.

1. Open the crontab for editing:
   ```bash
   crontab -e
   ```

2. Add the following line to run the script every Sunday at 2:00 AM:
   ```cron
   0 2 * * 0 /path/to/your/bun /path/to/your/project/src/weekly-distribute.ts
   ```
   Replace `/path/to/your/bun` with the actual path to your Bun executable and `/path/to/your/project` with the absolute path to the project directory.

## Testing

To run the tests:

```bash
bun test
```

The test suite uses mocked database and blockchain interactions to simulate the weekly rewards distribution. It seeds 100 random accounts, sets their TWAB state to random amounts, runs the distribution script, and verifies that the correct rewards are calculated and dispersed.