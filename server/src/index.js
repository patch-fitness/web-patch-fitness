const app = require('./app');
const pool = require('./config/db');

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API server ready on http://localhost:${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unable to connect to MySQL. Please check your configuration.', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}. Cleaning up...`);
  try {
    await pool.end();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error while closing MySQL pool', error);
  } finally {
    process.exit(0);
  }
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal);
  });
});

startServer();

