import { NextResponse } from "next/server";

export const ok = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ success: true, data }, init);

export const fail = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

export async function readJson(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
