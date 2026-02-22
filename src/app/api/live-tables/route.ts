import { NextRequest, NextResponse } from "next/server";
import { generateMockTables, paginateTables, type TableCategory } from "@/lib/live-tables";

const tables = generateMockTables();

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const category = (searchParams.get("category") ?? "all") as TableCategory;
  const search = searchParams.get("search") ?? "";

  // Simulate network latency for realistic loading states
  await new Promise((r) => setTimeout(r, 300));

  const result = paginateTables(tables, page, category, search);
  return NextResponse.json(result);
}
