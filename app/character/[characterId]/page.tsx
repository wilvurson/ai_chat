"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { FormattedMessage } from "@/components/formatted-message";

interface Message {
  id: string;
  content: string;
  role: "user" | "model";
  createdAt: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
}

export default function CharacterChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const characterId = params.characterId as string;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCharacter();
    fetchMessages();
  }, [characterId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchCharacter = async () => {
    try {
      const response = await fetch("/api/character");
      if (response.ok) {
        const characters = await response.json();
        const char = characters.find((c: Character) => c.id === characterId);
        setCharacter(char || null);
      }
    } catch (error) {
      console.error("Failed to fetch character:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/character/${characterId}/message`);
      if (response.ok) {
        const msgs = await response.json();
        setMessages(msgs);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const messageToSend = inputMessage;
    setInputMessage(""); // Clear input immediately
    setIsLoading(true);

    try {
      const response = await fetch(`/api/character/${characterId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: messageToSend }),
      });

      if (response.ok) {
        // Refetch messages to get the updated conversation
        await fetchMessages();
      } else {
        // If failed, restore the message
        setInputMessage(messageToSend);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // If failed, restore the message
      setInputMessage(messageToSend);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/character/${characterId}/message`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId }),
      });

      if (response.ok) {
        // Refetch messages to update the conversation
        await fetchMessages();
      } else {
        console.error("Failed to delete message");
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  if (!character) {
    return <div className="p-6">Loading character...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/admin/characters">
            <Button
              variant="outline"
              size="sm"
              className="hover:cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Characters
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <img
              src={character.image}
              alt={character.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h1 className="text-xl font-semibold">{character.name}</h1>
              <p className="text-sm text-muted-foreground">
                {character.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>Chat with {character.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto pr-4 mb-4 scrollbar-hide">
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex group ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="flex items-start gap-2 max-w-[70%]">
                      <div
                        className={`flex-1 p-3 rounded-lg break-words ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <FormattedMessage content={message.content} />
                      </div>
                      {message.role === "user" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMessage(message.id)}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form
              onSubmit={sendMessage}
              className="flex items-end gap-4 rounded-3xl p-4 bg-background/50"
            >
              <div className="flex-1 relative flex">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isLoading ? "Sending..." : "Message..."}
                  disabled={isLoading}
                  className="w-full max-h-32 resize-none rounded-2xl border border-input bg-background px-4 py-3 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!isLoading && inputMessage.trim()) {
                        sendMessage(e as any);
                      }
                    }
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                size="sm"
                className="h-11 w-11 rounded-full p-0"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-current"
                  >
                    <path
                      d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
