import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { messages } = await req.json();

    const recentReports = await prisma.report.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true } },
        unit: { select: { name: true } },
        location: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    });

    console.log("[Chat] Data for AI:", JSON.stringify(recentReports, null, 2));

    const units = await prisma.unit.findMany({
      select: { name: true, district: true },
    });

    const dbContext = JSON.stringify({ recentReports, units }, null, 2);

    const systemMessage = {
      role: "system",
      content: `Kamu adalah asisten keamanan SiPatrol (PLN Nusantara Power). 

Berikut adalah data terkini dari database:
${dbContext}

ATURAN FORMAT JAWABAN:
1. Jawab dengan data NYATA dari database di atas, JANGAN gunakan placeholder seperti [Nama Pelapor].
2. Gunakan bullet points (-) untuk setiap item.
3. Format setiap laporan:
   - **Waktu:** [tanggal asli dari data]
   - **Pelapor:** [nama asli dari data]
   - **Unit/Lokasi:** [nama unit] — [nama lokasi]
   - **Kategori:** [nama kategori]
   - **Catatan:** "[isi catatan asli dari data]"
4. Gunakan emoji K3 (⚠️, 🛡️, 📝, ✅, 📍).
5. Akhiri dengan kalimat penutup.`,
    };

    const updatedMessages = [systemMessage, ...messages];

    const result = streamText({
      model: openai("gpt-4o"),
      messages: updatedMessages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error:
          "Failed to process chat request. Please check your API configuration.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
