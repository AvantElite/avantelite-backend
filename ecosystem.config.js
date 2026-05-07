module.exports = {
  apps: [{
    name:         'avantservice-api',
    script:       'server.js',
    instances:    1,
    autorestart:  true,
    watch:        ['server.js', 'routes', 'db.js', 'auth.js', 'helpers.js', 'mailer.js', 'upload.js', 'ai.js'],
    ignore_watch: ['node_modules', 'uploads', 'logs', 'sql', '.git'],
    watch_delay:  1000,
    max_memory_restart: '300M',
    env_production: {
      NODE_ENV: 'production',
      PORT:     3000,
    },
    error_file:  'logs/err.log',
    out_file:    'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};
