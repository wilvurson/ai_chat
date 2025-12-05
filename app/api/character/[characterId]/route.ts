import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth";

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) => {
  try {
    const user = await requireAuth(req);
    const { characterId: id } = await params;

    // Get the character to find the image path (ensure it belongs to the user)
    const character = await prisma.character.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // Delete the image file if it exists
    if (character.image && character.image.startsWith("/uploads/")) {
      try {
        const imagePath = path.join(process.cwd(), "public", character.image);
        await fs.unlink(imagePath);
      } catch (error) {
        // Ignore if file doesn't exist
        console.log("Image file not found or already deleted");
      }
    }

    // Delete all messages associated with this character and user first
    await prisma.message.deleteMany({
      where: {
        character: {
          id,
        },
        userId: user.id,
      },
    });

    // Delete the character from database
    await prisma.character.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Character deleted successfully" });
  } catch (error) {
    console.error("Failed to delete character:", error);
    return NextResponse.json(
      { error: "Failed to delete character" },
      { status: 500 }
    );
  }
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) => {
  try {
    const user = await requireAuth(req);
    const { characterId: id } = await params;
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const basePrompt = formData.get("basePrompt") as string;
    const greetingText = formData.get("greetingText") as string;
    const imageFile = formData.get("image") as File | null;

    if (!name || !description || !basePrompt || !greetingText) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current character (ensure it belongs to the user)
    const currentCharacter = await prisma.character.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!currentCharacter) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    let imagePath = currentCharacter.image;

    // Handle image update
    if (imageFile) {
      // Delete old image if it exists
      if (
        currentCharacter.image &&
        currentCharacter.image.startsWith("/uploads/")
      ) {
        try {
          const oldImagePath = path.join(
            process.cwd(),
            "public",
            currentCharacter.image
          );
          await fs.unlink(oldImagePath);
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }

      // Save new image
      const fileExtension = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });

      const filePath = path.join(uploadsDir, fileName);
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      imagePath = `/uploads/${fileName}`;
    }

    // Update character
    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: {
        name,
        description,
        basePrompt,
        greetingText,
        image: imagePath,
      },
    });

    return NextResponse.json(updatedCharacter);
  } catch (error) {
    console.error("Failed to update character:", error);
    return NextResponse.json(
      { error: "Failed to update character" },
      { status: 500 }
    );
  }
};
