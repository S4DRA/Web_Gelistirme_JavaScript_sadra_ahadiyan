import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

function isValidProfileImage(value: unknown) {
  if (value === null) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  return (
    value.length <= 300_000 &&
    /^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(value)
  );
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();

    const data: {
      phoneNumber?: string;
      profileImage?: string | null;
      username?: string;
    } = {};

    if ("profileImage" in body && !isValidProfileImage(body.profileImage)) {
      return NextResponse.json(
        { error: "Upload a PNG, JPG, or WEBP image under 225 KB." },
        { status: 400 },
      );
    }

    if ("profileImage" in body) {
      data.profileImage = body.profileImage;
    }

    if ("username" in body) {
      if (typeof body.username !== "string" || body.username.trim().length < 3) {
        return NextResponse.json(
          { error: "Username must be at least 3 characters." },
          { status: 400 },
        );
      }

      const normalizedUsername = body.username.trim().toLowerCase();
      const prisma = getPrisma();
      const existingUser = await prisma.user.findUnique({
        where: { username: normalizedUsername },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: "This username is already taken." },
          { status: 409 },
        );
      }

      data.username = normalizedUsername;
    }

    if ("phoneNumber" in body) {
      if (typeof body.phoneNumber !== "string" || body.phoneNumber.trim().length < 7) {
        return NextResponse.json(
          { error: "Enter a valid phone number." },
          { status: 400 },
        );
      }

      data.phoneNumber = body.phoneNumber.trim();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No profile changes provided." }, { status: 400 });
    }

    const prisma = getPrisma();
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        email: true,
        id: true,
        phoneNumber: true,
        profileImage: true,
        username: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Failed to update profile:", error);

    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 },
    );
  }
}
