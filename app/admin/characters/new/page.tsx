"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function CreateCharacterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrompt: "",
    greetingText: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      !formData.name ||
      !formData.description ||
      !formData.basePrompt ||
      !formData.greetingText ||
      !imageFile
    ) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("basePrompt", formData.basePrompt);
      submitData.append("greetingText", formData.greetingText);
      submitData.append("image", imageFile);

      const response = await fetch("/api/character", {
        method: "POST",
        body: submitData,
      });

      if (response.ok) {
        router.push("/");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create character");
      }
    } catch (err) {
      setError("An error occurred while creating the character");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="hover:cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Characters
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create New Character</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Character Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter character name"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your character"
                    rows={3}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basePrompt">Base Prompt</Label>
                  <Textarea
                    id="basePrompt"
                    name="basePrompt"
                    value={formData.basePrompt}
                    onChange={handleInputChange}
                    placeholder="Define the character's personality and behavior"
                    rows={4}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greetingText">Greeting Text</Label>
                  <Textarea
                    id="greetingText"
                    name="greetingText"
                    value={formData.greetingText}
                    onChange={handleInputChange}
                    placeholder="What does the character say when starting a conversation?"
                    rows={3}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Character Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    disabled={loading}
                  />
                  {imageFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {imageFile.name}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating..." : "Create Character"}
                  </Button>
                  <Link href="/">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
