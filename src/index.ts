import 'reflect-metadata';
import {App, ApplicationConfig} from './application';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new App(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3000), // Configura el puerto
      host: process.env.HOST || '0.0.0.0', // Escucha en todas las interfaces
      gracePeriodForClose: 5000, // 5 segundos
      openApiSpec: {
        setServersFromRequest: true,
      },
    },
  };

  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
