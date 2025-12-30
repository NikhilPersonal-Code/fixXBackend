import { Request, Response } from 'express';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import db from '@config/dbConfig';
import { conversations, messages, users } from '@db/tables';
import { AuthRequest } from '@/types';

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Fetch conversations where the user is a participant
    const userConversations = await db.query.conversations.findMany({
      where: or(
        eq(conversations.participant1Id, userId),
        eq(conversations.participant2Id, userId),
      ),
      orderBy: [desc(conversations.lastMessageAt)],
      with: {
        participant1: true,
        participant2: true,
        task: true,
      },
    });

    // For each conversation, fetch the last message
    const conversationsWithLastMessage = await Promise.all(
      userConversations.map(async (conv) => {
        const lastMessage = await db.query.messages.findFirst({
          where: eq(messages.conversationId, conv.id),
          orderBy: [desc(messages.createdAt)],
        });

        // Determine the other participant
        const otherParticipant =
          conv.participant1Id === userId
            ? conv.participant2
            : conv.participant1;

        return {
          id: conv.id,
          taskId: conv.taskId,
          taskTitle: conv.task?.taskTitle ?? null,
          otherParticipant: {
            id: otherParticipant.id,
            name: otherParticipant.name,
            profileUrl: otherParticipant.profileUrl,
          },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                isRead: !!lastMessage.readAt,
                senderId: lastMessage.senderId,
              }
            : null,
          updatedAt: conv.updatedAt,
        };
      }),
    );

    res.status(200).json({
      status: 'ok',
      data: conversationsWithLastMessage,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
