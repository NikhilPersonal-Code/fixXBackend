// import AdminJSExpress from '@adminjs/express';
// import AdminJS from 'adminjs';
// import { Application } from 'express';
// import PgAdapter from 'adminjs-drizzle/pg';
// import * as schema from '@db/schema';
// import db from '@/config/dbConfig';

// const DEFAULT_ADMIN = {
//   email: 'fixdomination@gmail.com',
//   password: 'fixdomination',
// };

// export const authenticate = (email: string, password: string) => {
//   if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
//     return Promise.resolve(DEFAULT_ADMIN);
//   }
//   return null;
// };

// export const setupAdminJs = async (app: Application) => {
//   // Admin panel
//   const admin = new AdminJS({
//     databases: [{ db, schema }],
//     rootPath: '/admin',
//   });
//   AdminJS.registerAdapter(PgAdapter);
//   AdminJSExpress.buildRouter(admin, app);

//   const adminRouterAuthenticated = AdminJSExpress.buildAuthenticatedRouter(
//     admin,
//     {
//       authenticate,
//       cookieName: 'adminjs',
//       cookiePassword: 'sessionsecret',
//     },
//     null,
//     {
//       resave: true,
//       saveUninitialized: true,
//       secret: 'sessionsecret',
//       cookie: {
//         httpOnly: process.env.NODE_ENV === 'production',
//         secure: process.env.NODE_ENV === 'production',
//       },
//       name: 'adminjs',
//     },
//   );

//   const adminRouter = AdminJSExpress.buildRouter(admin);
//   app.use(admin.options.rootPath, adminRouterAuthenticated);
// };
