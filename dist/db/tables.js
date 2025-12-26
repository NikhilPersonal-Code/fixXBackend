"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referrals = exports.transactions = exports.notifications = exports.conversations = exports.messages = exports.reviews = exports.bookings = exports.offers = exports.taskImages = exports.tasks = exports.categories = exports.fixxerProfiles = exports.otps = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const enums_1 = require("./enums");
// ==================== CORE TABLES ====================
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').unique().notNull(),
    username: (0, pg_core_1.text)('username').unique().notNull(),
    passwordHash: (0, pg_core_1.text)('password_hash'),
    // phoneNumber: varchar('phone_number', { length: 20 }).unique(),
    profileUrl: (0, pg_core_1.text)('profile_url'),
    userRole: (0, enums_1.userRoleEnum)('user_role').default('both').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(false).notNull(),
    isEmailVerified: (0, pg_core_1.boolean)('is_email_verified').default(false).notNull(),
    // Keeping Email authentication only for now. Phone verification can be added later. --- NikhilRW
    // isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
    resetToken: (0, pg_core_1.text)('reset_token'),
    resetTokenExpires: (0, pg_core_1.timestamp)('reset_token_expires'),
    lastLoginAt: (0, pg_core_1.timestamp)('last_login_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('users_email_idx').on(table.email),
    (0, pg_core_1.index)('users_username_idx').on(table.username),
    (0, pg_core_1.index)('users_user_role_idx').on(table.userRole),
]);
exports.otps = (0, pg_core_1.pgTable)('otps', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.text)('email').notNull(),
    otp: (0, pg_core_1.varchar)('otp', { length: 6 }).notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    isUsed: (0, pg_core_1.boolean)('is_used').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('otps_email_idx').on(table.email),
    (0, pg_core_1.index)('otps_expires_at_idx').on(table.expiresAt),
]);
exports.fixxerProfiles = (0, pg_core_1.pgTable)('fixxer_profiles', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .unique()
        .notNull(),
    // If fixxer sets its hourly rate by default - this feature will be added in the future --- NikhilRW
    hourlyRate: (0, pg_core_1.numeric)('hourly_rate', { precision: 10, scale: 2 }),
    completedTasksCount: (0, pg_core_1.integer)('completed_tasks_count').default(0).notNull(),
    averageRating: (0, pg_core_1.numeric)('average_rating', { precision: 3, scale: 2 }),
    // totalEarnings: numeric('total_earnings', { precision: 12, scale: 2 })
    // .default('0')
    // .notNull(),
    isAvailable: (0, pg_core_1.boolean)('is_available').default(true).notNull(),
    locationPreferences: (0, pg_core_1.geometry)('location_preferences', {
        type: 'point',
        mode: 'xy',
        srid: 4326,
    }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('fixxer_profiles_user_id_idx').on(table.userId),
    (0, pg_core_1.index)('fixxer_profiles_is_available_idx').on(table.isAvailable),
]);
exports.categories = (0, pg_core_1.pgTable)('categories', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    categoryName: (0, pg_core_1.varchar)('category_name', { length: 100 }).unique().notNull(),
    description: (0, pg_core_1.text)('description'),
    iconUrl: (0, pg_core_1.text)('icon_url'),
    displayOrder: (0, pg_core_1.integer)('display_order').default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [(0, pg_core_1.index)('categories_category_name_idx').on(table.categoryName)]);
exports.tasks = (0, pg_core_1.pgTable)('tasks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    clientId: (0, pg_core_1.uuid)('client_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    categoryId: (0, pg_core_1.uuid)('category_id')
        .references(() => exports.categories.id)
        .notNull(),
    assignedFixxerId: (0, pg_core_1.uuid)('assigned_fixxer_id').references(() => exports.users.id, {
        onDelete: 'set null',
    }),
    taskTitle: (0, pg_core_1.varchar)('task_title', { length: 200 }).notNull(),
    taskDescription: (0, pg_core_1.text)('task_description').notNull(),
    taskLocation: (0, pg_core_1.geometry)('task_location', {
        type: 'point',
        mode: 'xy',
        srid: 4326,
    }).notNull(),
    locationAddress: (0, pg_core_1.text)('location_address'),
    voiceInstructionUrl: (0, pg_core_1.text)('voice_instruction_url'),
    mustHaveItems: (0, pg_core_1.text)('must_have_items'),
    scheduledAt: (0, pg_core_1.timestamp)('scheduled_at'),
    isAsap: (0, pg_core_1.boolean)('is_asap').default(false).notNull(),
    budget: (0, pg_core_1.numeric)('budget', { precision: 10, scale: 2 }),
    priceType: (0, enums_1.priceTypeEnum)('price_type').default('total'),
    openToOffer: (0, pg_core_1.boolean)('open_to_offer').default(false).notNull(),
    typeOfTask: (0, enums_1.typeOfTaskEnum)('type_of_task').default('in_person').notNull(),
    status: (0, enums_1.taskStatusEnum)('status').default('posted').notNull(),
    offerCount: (0, pg_core_1.integer)('offer_count').default(0).notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    cancelledAt: (0, pg_core_1.timestamp)('cancelled_at'),
    cancellationReason: (0, pg_core_1.text)('cancellation_reason'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('tasks_client_id_idx').on(table.clientId),
    (0, pg_core_1.index)('tasks_category_id_idx').on(table.categoryId),
    (0, pg_core_1.index)('tasks_assigned_fixxer_id_idx').on(table.assignedFixxerId),
    (0, pg_core_1.index)('tasks_status_idx').on(table.status),
    (0, pg_core_1.index)('tasks_created_at_idx').on(table.createdAt),
    (0, pg_core_1.index)('tasks_location_idx').using('gist', table.taskLocation),
    (0, pg_core_1.check)('budget_check', (0, drizzle_orm_1.sql) `budget > 0`),
    (0, pg_core_1.check)('task_title_length_check', (0, drizzle_orm_1.sql) `char_length(task_title) > 10`),
    (0, pg_core_1.check)('task_description_length_check', (0, drizzle_orm_1.sql) `char_length(task_description) > 25`),
]);
exports.taskImages = (0, pg_core_1.pgTable)('task_images', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    taskId: (0, pg_core_1.uuid)('task_id')
        .references(() => exports.tasks.id, { onDelete: 'cascade' })
        .notNull(),
    imageUrl: (0, pg_core_1.text)('image_url').notNull(),
    displayOrder: (0, pg_core_1.integer)('display_order').default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => [(0, pg_core_1.index)('task_images_task_id_idx').on(table.taskId)]);
exports.offers = (0, pg_core_1.pgTable)('offers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    taskId: (0, pg_core_1.uuid)('task_id')
        .references(() => exports.tasks.id, { onDelete: 'cascade' })
        .notNull(),
    fixxerId: (0, pg_core_1.uuid)('fixxer_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    price: (0, pg_core_1.numeric)('price', { precision: 10, scale: 2 }).notNull(),
    message: (0, pg_core_1.text)('message'),
    estimatedDuration: (0, pg_core_1.varchar)('estimated_duration', { length: 50 }),
    status: (0, enums_1.offerStatusEnum)('status').default('pending').notNull(),
    respondedAt: (0, pg_core_1.timestamp)('responded_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('offers_task_id_idx').on(table.taskId),
    (0, pg_core_1.index)('offers_fixxer_id_idx').on(table.fixxerId),
    (0, pg_core_1.index)('offers_status_idx').on(table.status),
    (0, pg_core_1.index)('offers_unique_idx').on(table.taskId, table.fixxerId),
    (0, pg_core_1.check)('price_check', (0, drizzle_orm_1.sql) `price > 0`),
]);
exports.bookings = (0, pg_core_1.pgTable)('bookings', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    taskId: (0, pg_core_1.uuid)('task_id')
        .references(() => exports.tasks.id, { onDelete: 'cascade' })
        .unique()
        .notNull(),
    clientId: (0, pg_core_1.uuid)('client_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    fixxerId: (0, pg_core_1.uuid)('fixxer_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    offerId: (0, pg_core_1.uuid)('offer_id').references(() => exports.offers.id, {
        onDelete: 'set null',
    }),
    agreedPrice: (0, pg_core_1.numeric)('agreed_price', { precision: 10, scale: 2 }).notNull(),
    status: (0, enums_1.bookingStatusEnum)('status').default('confirmed').notNull(),
    startedAt: (0, pg_core_1.timestamp)('started_at'),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    cancelledAt: (0, pg_core_1.timestamp)('cancelled_at'),
    cancellationReason: (0, pg_core_1.text)('cancellation_reason'),
    cancelledBy: (0, pg_core_1.uuid)('cancelled_by').references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('bookings_task_id_idx').on(table.taskId),
    (0, pg_core_1.index)('bookings_client_id_idx').on(table.clientId),
    (0, pg_core_1.index)('bookings_fixxer_id_idx').on(table.fixxerId),
    (0, pg_core_1.index)('bookings_status_idx').on(table.status),
    (0, pg_core_1.check)('agreed_price_check', (0, drizzle_orm_1.sql) `agreed_price > 0`),
]);
exports.reviews = (0, pg_core_1.pgTable)('reviews', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    bookingId: (0, pg_core_1.uuid)('booking_id')
        .references(() => exports.bookings.id, { onDelete: 'cascade' })
        .unique()
        .notNull(),
    clientId: (0, pg_core_1.uuid)('client_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    fixxerId: (0, pg_core_1.uuid)('fixxer_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    rating: (0, enums_1.reviewRatingEnum)('rating').notNull(),
    comment: (0, pg_core_1.text)('comment'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('reviews_booking_id_idx').on(table.bookingId),
    (0, pg_core_1.index)('reviews_client_id_idx').on(table.clientId),
    (0, pg_core_1.index)('reviews_fixxer_id_idx').on(table.fixxerId),
]);
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    conversationId: (0, pg_core_1.uuid)('conversation_id')
        .references(() => exports.conversations.id, { onDelete: 'cascade' })
        .notNull(),
    senderId: (0, pg_core_1.uuid)('sender_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    attachmentUrl: (0, pg_core_1.text)('attachment_url'),
    status: (0, enums_1.messageStatusEnum)('status').default('sent').notNull(),
    readAt: (0, pg_core_1.timestamp)('read_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('messages_conversation_id_idx').on(table.conversationId),
    (0, pg_core_1.index)('messages_sender_id_idx').on(table.senderId),
    (0, pg_core_1.index)('messages_created_at_idx').on(table.createdAt),
]);
exports.conversations = (0, pg_core_1.pgTable)('conversations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    taskId: (0, pg_core_1.uuid)('task_id').references(() => exports.tasks.id, {
        onDelete: 'set null',
    }),
    participant1Id: (0, pg_core_1.uuid)('participant1_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    participant2Id: (0, pg_core_1.uuid)('participant2_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    lastMessageAt: (0, pg_core_1.timestamp)('last_message_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('conversations_task_id_idx').on(table.taskId),
    (0, pg_core_1.index)('conversations_participant1_id_idx').on(table.participant1Id),
    (0, pg_core_1.index)('conversations_participant2_id_idx').on(table.participant2Id),
    (0, pg_core_1.index)('conversations_unique_idx').on(table.participant1Id, table.participant2Id, table.taskId),
]);
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    type: (0, enums_1.notificationTypeEnum)('type').notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 200 }).notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    relatedTaskId: (0, pg_core_1.uuid)('related_task_id').references(() => exports.tasks.id, {
        onDelete: 'cascade',
    }),
    relatedUserId: (0, pg_core_1.uuid)('related_user_id').references(() => exports.users.id, {
        onDelete: 'cascade',
    }),
    // isRead: boolean('is_read').default(false).notNull(),
    // readAt: timestamp('read_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('notifications_user_id_idx').on(table.userId),
    // index('notifications_is_read_idx').on(table.isRead),
    (0, pg_core_1.index)('notifications_created_at_idx').on(table.createdAt),
]);
exports.transactions = (0, pg_core_1.pgTable)('transactions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    bookingId: (0, pg_core_1.uuid)('booking_id').references(() => exports.bookings.id, {
        onDelete: 'set null',
    }),
    type: (0, enums_1.transactionTypeEnum)('type').notNull(),
    amount: (0, pg_core_1.numeric)('amount', { precision: 12, scale: 2 }).notNull(),
    status: (0, enums_1.transactionStatusEnum)('status').default('pending').notNull(),
    paymentGateway: (0, pg_core_1.varchar)('payment_gateway', { length: 50 }),
    transactionReference: (0, pg_core_1.varchar)('transaction_reference', { length: 200 }),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('transactions_user_id_idx').on(table.userId),
    (0, pg_core_1.index)('transactions_booking_id_idx').on(table.bookingId),
    (0, pg_core_1.index)('transactions_status_idx').on(table.status),
    (0, pg_core_1.index)('transactions_created_at_idx').on(table.createdAt),
    (0, pg_core_1.check)('amount_check', (0, drizzle_orm_1.sql) `amount > 0`),
]);
exports.referrals = (0, pg_core_1.pgTable)('referrals', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    referrerId: (0, pg_core_1.uuid)('referrer_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .notNull(),
    referredUserId: (0, pg_core_1.uuid)('referred_user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .unique()
        .notNull(),
    referralCode: (0, pg_core_1.varchar)('referral_code', { length: 20 }).unique().notNull(),
    bonusAmount: (0, pg_core_1.numeric)('bonus_amount', { precision: 10, scale: 2 })
        .default('100')
        .notNull(),
    isPaid: (0, pg_core_1.boolean)('is_paid').default(false).notNull(),
    paidAt: (0, pg_core_1.timestamp)('paid_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('referrals_referrer_id_idx').on(table.referrerId),
    (0, pg_core_1.index)('referrals_referral_code_idx').on(table.referralCode),
]);
