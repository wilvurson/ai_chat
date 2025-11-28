import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    // Get the character to find the image path
    const character = await prisma.charecter.findUnique({
      where: { id },
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

    // Delete the character from database
    await prisma.charecter.delete({
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
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const desciption = formData.get("desciption") as string;
    const imageFile = formData.get("image") as File | null;

    if (!name || !desciption) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current character
    const currentCharacter = await prisma.charecter.findUnique({
      where: { id },
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
    const updatedCharacter = await prisma.charecter.update({
      where: { id },
      data: {
        name,
        desciption,
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
