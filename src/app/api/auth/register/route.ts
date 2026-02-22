import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      console.log(
        "\x1b[31m[RAPID ROLE :: REGISTER]\x1b[0m Missing fields"
      );
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username) || username.length < 3) {
      return NextResponse.json(
        { error: "Username must be 3+ alphanumeric characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const existingEmail = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingEmail) {
      console.log(
        "\x1b[33m[RAPID ROLE :: REGISTER]\x1b[0m Duplicate email:",
        email
      );
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log(
        "\x1b[33m[RAPID ROLE :: REGISTER]\x1b[0m Duplicate username:",
        username
      );
      return NextResponse.json(
        { error: "Username already taken." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      hashedPassword,
    });

    console.log(
      "\x1b[32m[RAPID ROLE :: REGISTER]\x1b[0m New player created:",
      user.username,
      "| Balance: $0.00 | VIP: 0"
    );

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "\x1b[31m[RAPID ROLE :: FATAL]\x1b[0m Registration error:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
