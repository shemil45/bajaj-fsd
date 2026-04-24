import { NextResponse } from "next/server";
import { processInput } from "@/lib/processor";
import type { ApiResponse, RequestBody } from "@/types";

export const DEFAULT_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const IDENTITY = {
  user_id: process.env.BFHL_USER_ID ?? "john_doe_17091999",
  email_id: process.env.BFHL_EMAIL_ID ?? "john@xyz.com",
  college_roll_number: process.env.BFHL_COLLEGE_ROLL_NUMBER ?? "ABCD123",
};

type ErrorBody = {
  is_success: false;
  error: string;
};

function jsonResponse(body: ApiResponse | ErrorBody, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: DEFAULT_HEADERS,
  });
}

export function handleOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: DEFAULT_HEADERS,
  });
}

export async function handlePost(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(
      {
        is_success: false,
        error: "Content-Type must be application/json.",
      },
      415,
    );
  }

  try {
    const body = (await request.json()) as RequestBody;
    const result = processInput(body.data);

    return jsonResponse({
      is_success: true,
      ...IDENTITY,
      ...result,
    });
  } catch {
    return jsonResponse(
      {
        is_success: false,
        error: "Request body must be valid JSON.",
      },
      400,
    );
  }
}
