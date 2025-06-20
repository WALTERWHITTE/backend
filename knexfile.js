module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host : '127.0.0.1',
      user : 'root',
      password : 'root',
      database : 'UnifiedMessaging'
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};
