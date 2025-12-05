import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) => {
  try {
    const user = await requireAuth(req);
    const { characterId } = await params;

    const chats = await prisma.message.findMany({
      where: {
        character: {
          id: characterId,
        },
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(chats);
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
};

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) => {
  try {
    const user = await requireAuth(req);
    const { characterId } = await params;
    const { content } = await req.json();

    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return NextResponse.json(
        { message: "Character not found!" },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        character: {
          id: characterId,
        },
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let chat;

    // CHATLAAGUI BOL SETUP HIIH HESEG
    if (messages.length === 0) {
      chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: character.basePrompt }] },
          { role: "model", parts: [{ text: character.greetingText }] },
        ],
      });
    } else {
      const history = [
        { role: "user", parts: [{ text: character.basePrompt }] },
        { role: "model", parts: [{ text: character.greetingText }] },
      ];

      messages.forEach((message: { role: any; content: any }) => {
        history.push({
          role: message.role,
          parts: [{ text: message.content }],
        });
      });

      chat = model.startChat({
        history,
      });
    }

    await prisma.message.create({
      data: {
        character: {
          connect: {
            id: characterId,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
        content,
        role: "user",
      },
    });

    const result = await chat.sendMessage(content);
    const response = result.response;
    const text = response.text();

    await prisma.message.create({
      data: {
        character: {
          connect: {
            id: characterId,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
        content: text,
        role: "model",
      },
    });
    return NextResponse.json({ message: text });
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) => {
  try {
    const user = await requireAuth(req);
    const { characterId } = await params;
    const { messageId }: { messageId: string } = await req.json();
    // Find the message to delete (ensure it belongs to the user)
    const messageToDelete = await prisma.message.findUnique({
      where: {
        id: messageId,
        userId: user.id,
      },
    });

    if (!messageToDelete) {
      return NextResponse.json(
        { message: "Message not found!" },
        { status: 404 }
      );
    }

    // Only allow deleting user messages
    if (messageToDelete.role !== "user") {
      return NextResponse.json(
        { message: "Can only delete user messages!" },
        { status: 400 }
      );
    }

    // Find all messages for this character and user, ordered by creation time
    const allMessages = await prisma.message.findMany({
      where: {
        characterId,
        userId: user.id,
      },
      orderBy: { createdAt: "asc" },
    });

    // Find the index of the message to delete
    const messageIndex = allMessages.findIndex((msg) => msg.id === messageId);

    if (messageIndex === -1) {
      return NextResponse.json(
        { message: "Message not found in conversation!" },
        { status: 404 }
      );
    }

    // Delete the user message
    await prisma.message.delete({
      where: { id: messageId },
    });

    // If there's a next message (AI response), delete it too
    if (
      messageIndex + 1 < allMessages.length &&
      allMessages[messageIndex + 1].role === "model"
    ) {
      await prisma.message.delete({
        where: { id: allMessages[messageIndex + 1].id },
      });
    }

    return NextResponse.json({ message: "Messages deleted successfully" });
  } catch (error) {
    console.error("Failed to delete messages:", error);
    return NextResponse.json(
      { message: "Failed to delete messages" },
      { status: 500 }
    );
  }
};
