import { DataSource } from 'typeorm';

export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'farmera',
    entities: [__dirname + '**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/src/migrations/**/*{.ts,.js}']
});