"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { useAuth } from "@/lib/auth-context";

interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
}

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    if (user) {
      fetchCharacters();
    }
  }, [user]);

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/character");
      if (response.ok) {
        const chars = await response.json();
        setCharacters(chars);
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">AI Characters</h1>
          <div className="flex items-center gap-4">
            <Link href="/admin/characters/new">
              <Button>Create Character</Button>
            </Link>
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Card
              key={character.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-xl">{character.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/characters/${character.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (
                          confirm(
                            "Are you sure you want to delete this character?"
                          )
                        ) {
                          try {
                            const response = await fetch(
                              `/api/character/${character.id}`,
                              {
                                method: "DELETE",
                              }
                            );
                            if (response.ok) {
                              // Refresh the page to update the character list
                              window.location.reload();
                            } else {
                              alert("Failed to delete character");
                            }
                          } catch (error) {
                            alert("Failed to delete character");
                          }
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {character.description}
                </p>
                <Link href={`/character/${character.id}`}>
                  <Button className="w-full cursor-pointer">Start Chat</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {characters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No characters available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
