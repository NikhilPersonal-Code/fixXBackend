import { Server, Socket } from 'socket.io';
import db from '@config/dbConfig';
import { messages, conversations } from '@db/tables';
import { eq, and, or, desc } from 'drizzle-orm';

const userSockets = new Map<string, string>(); // userId -> socketId

export const initSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId: string) => {
      userSockets.set(userId, socket.id);
      console.log(`User ${userId} joined with socket ${socket.id}`);
    });

    // Send message
    socket.on(
      'send_message',
      async (data: {
        conversationId: string;
        senderId: string;
        recipientId: string;
        content: string;
        taskId?: string;
      }) => {
        try {
          let convId = data.conversationId;

          // Create conversation if doesn't exist
          if (!convId) {
            const existing = await db.query.conversations.findFirst({
              where: and(
                or(
                  and(
                    eq(conversations.participant1Id, data.senderId),
                    eq(conversations.participant2Id, data.recipientId),
                  ),
                  and(
                    eq(conversations.participant1Id, data.recipientId),
                    eq(conversations.participant2Id, data.senderId),
                  ),
                ),
                data.taskId ? eq(conversations.taskId, data.taskId) : undefined,
              ),
            });

            if (existing) {
              convId = existing.id;
            } else {
              const [newConv] = await db
                .insert(conversations)
                .values({
                  participant1Id: data.senderId,
                  participant2Id: data.recipientId,
                  taskId: data.taskId || null,
                  lastMessageAt: new Date(),
                })
                .returning();
              convId = newConv.id;
            }
          }

          // Insert message
          const [newMessage] = await db
            .insert(messages)
            .values({
              conversationId: convId,
              senderId: data.senderId,
              content: data.content,
              status: 'sent',
            })
            .returning();

          // Update conversation timestamp
          await db
            .update(conversations)
            .set({ lastMessageAt: new Date() })
            .where(eq(conversations.id, convId));

          // Emit to recipient if online
          const recipientSocketId = userSockets.get(data.recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('receive_message', {
              ...newMessage,
              conversationId: convId,
            });
          }

          // Confirm to sender
          socket.emit('message_sent', {
            ...newMessage,
            conversationId: convId,
          });
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('message_error', { error: 'Failed to send message' });
        }
      },
    );

    // Load conversation messages
    socket.on(
      'load_messages',
      async (data: {
        senderId: string;
        recipientId: string;
        taskId?: string;
      }) => {
        try {
          const conv = await db.query.conversations.findFirst({
            where: and(
              or(
                and(
                  eq(conversations.participant1Id, data.senderId),
                  eq(conversations.participant2Id, data.recipientId),
                ),
                and(
                  eq(conversations.participant1Id, data.recipientId),
                  eq(conversations.participant2Id, data.senderId),
                ),
              ),
              data.taskId ? eq(conversations.taskId, data.taskId) : undefined,
            ),
          });

          if (!conv) {
            socket.emit('messages_loaded', {
              conversationId: null,
              messages: [],
            });
            return;
          }

          const msgs = await db.query.messages.findMany({
            where: eq(messages.conversationId, conv.id),
            orderBy: [messages.createdAt],
          });

          socket.emit('messages_loaded', {
            conversationId: conv.id,
            messages: msgs,
          });
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      },
    );

    socket.on('disconnect', () => {
      // Remove user from map
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};
