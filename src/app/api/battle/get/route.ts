import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "battle.json");
    const fileData = await fs.readFile(filePath, "utf-8");
    const battleData = JSON.parse(fileData);
    return NextResponse.json(battleData);
  } catch (error) {
    console.error("Error reading battle data:", error);
    return NextResponse.json(
      { error: "Failed to read battle data" },
      { status: 500 }
    );
  }
} 