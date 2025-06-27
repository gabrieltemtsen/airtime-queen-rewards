
import { db } from './db';

async function migrate() {
  try {
    await db.schema
      .createTable('users')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('wallet_address', 'varchar(255)', (col) => col.notNull().unique())
      .execute();

    await db.schema
      .createTable('job_runs')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('last_run_timestamp', 'timestamp', (col) => col.notNull())
      .execute();

    console.log('Migrations ran successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

migrate();
