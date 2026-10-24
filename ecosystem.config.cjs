module.exports = {
  apps: [
    {
      name: 'sim-gtk',
      script: './server.js',
      instances: 1, // Wajib 1 instance karena SQLite (better-sqlite3) & in-memory session
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
