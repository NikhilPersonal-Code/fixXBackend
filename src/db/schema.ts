import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  username: text('username').unique(),
  password_hash: text('password_hash'),
  profile_url: text('profile_url'),
  isActive: integer('isActive').default(0),
  reset_token: text('reset_token'),
  reset_token_expires: timestamp('reset_token_expires'),
});

export const otps = pgTable('otps', {
  id: serial('id').primaryKey(),
  email: text('email'),
  otp: text('otp'),
});
