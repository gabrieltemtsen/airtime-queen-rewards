
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { config } from '../config/config';

interface UserTable {
  id: number;
  wallet_address: string;
}

interface JobRunTable {
  id: number;
  last_run_timestamp: Date;
}

interface Database {
  users: UserTable;
  job_runs: JobRunTable;
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: config.databaseUrl,
    }),
  }),
});
