import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { exportUserData } from "@/lib/gdpr/export";

// Descarcă toate datele utilizatorului ca JSON (drept de acces/portabilitate).
export async function GET() {
  try {
    const user = await requireUser();
    const data = await exportUserData(user.id);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="datele-mele.json"',
      },
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    throw e;
  }
}
