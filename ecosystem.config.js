module.exports = {
  apps: [
    {
      name: 'galinhagorda',
      script: '.next/standalone/server.js',
      cwd: '/home/rafaeljrs/gits/galinhagorda',
      env: {
        NODE_ENV: 'production',
        PORT: 3491,
        TZ: 'America/Sao_Paulo',
      },
    },
  ],
};
