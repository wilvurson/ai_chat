import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const characters = await prisma.charecter.findMany();
    return NextResponse.json(characters);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const desciption = formData.get("desciption") as string;
    const imageFile = formData.get("image") as File;

    if (!name || !desciption || !imageFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;

    // Save file to public/uploads directory
    const fs = await import("fs");
    const path = await import("path");

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    // Store relative path in database
    const imagePath = `/uploads/${fileName}`;

    const character = await prisma.charecter.create({
      data: {
        name,
        desciption,
        image: imagePath,
      },
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error("Failed to create character:", error);
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 }
    );
  }
};
