FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock ./ 

RUN bun install --frozen-lockfile

COPY . .

RUN bun run src/db/migrate.ts

CMD ["bun", "run", "src/weekly-distribute.ts"]
