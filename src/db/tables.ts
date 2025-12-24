import 'tsconfig-paths/register';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  jsonb,
  index,
  varchar,
  check,
  geometry,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  bookingStatusEnum,
  messageStatusEnum,
  notificationTypeEnum,
  offerStatusEnum,
  priceTypeEnum,
  reviewRatingEnum,
  taskStatusEnum,
  transactionStatusEnum,
  transactionTypeEnum,
  typeOfTaskEnum,
  userRoleEnum,
} from './enums';

// ==================== CORE TABLES ====================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').unique().notNull(),
    username: text('username').unique().notNull(),
    passwordHash: text('password_hash'),
    // phoneNumber: varchar('phone_number', { length: 20 }).unique(),
    profileUrl: text('profile_url'),
    userRole: userRoleEnum('user_role').default('both').notNull(),
    isActive: boolean('is_active').default(false).notNull(),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),
    // Keeping Email authentication only for now. Phone verification can be added later. --- NikhilRW
    // isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
    resetToken: text('reset_token'),
    resetTokenExpires: timestamp('reset_token_expires'),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_username_idx').on(table.username),
    index('users_user_role_idx').on(table.userRole),
  ],
);

export const otps = pgTable(
  'otps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    otp: varchar('otp', { length: 6 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    isUsed: boolean('is_used').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('otps_email_idx').on(table.email),
    index('otps_expires_at_idx').on(table.expiresAt),
  ],
);

export const fixxerProfiles = pgTable(
  'fixxer_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    // If fixxer sets its hourly rate by default - this feature will be added in the future --- NikhilRW
    hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
    completedTasksCount: integer('completed_tasks_count').default(0).notNull(),
    averageRating: numeric('average_rating', { precision: 3, scale: 2 }),
    // totalEarnings: numeric('total_earnings', { precision: 12, scale: 2 })
    // .default('0')
    // .notNull(),
    isAvailable: boolean('is_available').default(true).notNull(),
    locationPreferences: geometry('location_preferences', {
      type: 'point',
      mode: 'xy',
      srid: 4326,
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('fixxer_profiles_user_id_idx').on(table.userId),
    index('fixxer_profiles_is_available_idx').on(table.isAvailable),
  ],
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryName: varchar('category_name', { length: 100 }).unique().notNull(),
    description: text('description'),
    iconUrl: text('icon_url'),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('categories_category_name_idx').on(table.categoryName)],
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    categoryId: uuid('category_id')
      .references(() => categories.id)
      .notNull(),
    assignedFixxerId: uuid('assigned_fixxer_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    taskTitle: varchar('task_title', { length: 200 }).notNull(),
    taskDescription: text('task_description').notNull(),
    taskLocation: geometry('task_location', {
      type: 'point',
      mode: 'xy',
      srid: 4326,
    }).notNull(),
    locationAddress: text('location_address'),
    voiceInstructionUrl: text('voice_instruction_url'),
    mustHaveItems: text('must_have_items'),
    scheduledAt: timestamp('scheduled_at'),
    isAsap: boolean('is_asap').default(false).notNull(),
    budget: numeric('budget', { precision: 10, scale: 2 }),
    priceType: priceTypeEnum('price_type').default('total'),
    openToOffer: boolean('open_to_offer').default(false).notNull(),
    typeOfTask: typeOfTaskEnum('type_of_task').default('in_person').notNull(),
    status: taskStatusEnum('status').default('posted').notNull(),
    offerCount: integer('offer_count').default(0).notNull(),
    completedAt: timestamp('completed_at'),
    cancelledAt: timestamp('cancelled_at'),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('tasks_client_id_idx').on(table.clientId),
    index('tasks_category_id_idx').on(table.categoryId),
    index('tasks_assigned_fixxer_id_idx').on(table.assignedFixxerId),
    index('tasks_status_idx').on(table.status),
    index('tasks_created_at_idx').on(table.createdAt),
    index('tasks_location_idx').using('gist', table.taskLocation),
    check('budget_check', sql`budget > 0`),
    check('task_title_length_check', sql`char_length(task_title) > 10`),
    check(
      'task_description_length_check',
      sql`char_length(task_description) > 25`,
    ),
  ],
);

export const taskImages = pgTable(
  'task_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .references(() => tasks.id, { onDelete: 'cascade' })
      .notNull(),
    imageUrl: text('image_url').notNull(),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('task_images_task_id_idx').on(table.taskId)],
);

export const offers = pgTable(
  'offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .references(() => tasks.id, { onDelete: 'cascade' })
      .notNull(),
    fixxerId: uuid('fixxer_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    message: text('message'),
    estimatedDuration: varchar('estimated_duration', { length: 50 }),
    status: offerStatusEnum('status').default('pending').notNull(),
    respondedAt: timestamp('responded_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('offers_task_id_idx').on(table.taskId),
    index('offers_fixxer_id_idx').on(table.fixxerId),
    index('offers_status_idx').on(table.status),
    index('offers_unique_idx').on(table.taskId, table.fixxerId),
    check('price_check', sql`price > 0`),
  ],
);

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .references(() => tasks.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    clientId: uuid('client_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    fixxerId: uuid('fixxer_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    offerId: uuid('offer_id').references(() => offers.id, {
      onDelete: 'set null',
    }),
    agreedPrice: numeric('agreed_price', { precision: 10, scale: 2 }).notNull(),
    status: bookingStatusEnum('status').default('confirmed').notNull(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    cancelledAt: timestamp('cancelled_at'),
    cancellationReason: text('cancellation_reason'),
    cancelledBy: uuid('cancelled_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('bookings_task_id_idx').on(table.taskId),
    index('bookings_client_id_idx').on(table.clientId),
    index('bookings_fixxer_id_idx').on(table.fixxerId),
    index('bookings_status_idx').on(table.status),
    check('agreed_price_check', sql`agreed_price > 0`),
  ],
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id')
      .references(() => bookings.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    clientId: uuid('client_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    fixxerId: uuid('fixxer_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    rating: reviewRatingEnum('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('reviews_booking_id_idx').on(table.bookingId),
    index('reviews_client_id_idx').on(table.clientId),
    index('reviews_fixxer_id_idx').on(table.fixxerId),
  ],
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .references(() => conversations.id, { onDelete: 'cascade' })
      .notNull(),
    senderId: uuid('sender_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    content: text('content').notNull(),
    attachmentUrl: text('attachment_url'),
    status: messageStatusEnum('status').default('sent').notNull(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('messages_conversation_id_idx').on(table.conversationId),
    index('messages_sender_id_idx').on(table.senderId),
    index('messages_created_at_idx').on(table.createdAt),
  ],
);

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id').references(() => tasks.id, {
      onDelete: 'set null',
    }),
    participant1Id: uuid('participant1_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    participant2Id: uuid('participant2_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    lastMessageAt: timestamp('last_message_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('conversations_task_id_idx').on(table.taskId),
    index('conversations_participant1_id_idx').on(table.participant1Id),
    index('conversations_participant2_id_idx').on(table.participant2Id),
    index('conversations_unique_idx').on(
      table.participant1Id,
      table.participant2Id,
      table.taskId,
    ),
  ],
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    relatedTaskId: uuid('related_task_id').references(() => tasks.id, {
      onDelete: 'cascade',
    }),
    relatedUserId: uuid('related_user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    // isRead: boolean('is_read').default(false).notNull(),
    // readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('notifications_user_id_idx').on(table.userId),
    // index('notifications_is_read_idx').on(table.isRead),
    index('notifications_created_at_idx').on(table.createdAt),
  ],
);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    bookingId: uuid('booking_id').references(() => bookings.id, {
      onDelete: 'set null',
    }),
    type: transactionTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    status: transactionStatusEnum('status').default('pending').notNull(),
    paymentGateway: varchar('payment_gateway', { length: 50 }),
    transactionReference: varchar('transaction_reference', { length: 200 }),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('transactions_user_id_idx').on(table.userId),
    index('transactions_booking_id_idx').on(table.bookingId),
    index('transactions_status_idx').on(table.status),
    index('transactions_created_at_idx').on(table.createdAt),
    check('amount_check', sql`amount > 0`),
  ],
);

export const referrals = pgTable(
  'referrals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    referrerId: uuid('referrer_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    referredUserId: uuid('referred_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    referralCode: varchar('referral_code', { length: 20 }).unique().notNull(),
    bonusAmount: numeric('bonus_amount', { precision: 10, scale: 2 })
      .default('100')
      .notNull(),
    isPaid: boolean('is_paid').default(false).notNull(),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('referrals_referrer_id_idx').on(table.referrerId),
    index('referrals_referral_code_idx').on(table.referralCode),
  ],
);
