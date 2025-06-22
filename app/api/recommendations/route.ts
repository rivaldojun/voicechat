import { type NextRequest, NextResponse } from "next/server"
// import { getRecommendations } from "@/app/add-formation/actions"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const formationId = searchParams.get("id")
    const limit = Number.parseInt(searchParams.get("limit") || "3", 10)

    if (!formationId) {
      return NextResponse.json({ error: "ID de formation requis" }, { status: 400 })
    }

    // const recommendations = await getRecommendations(formationId, limit)

    return NextResponse.json({ message: "Recommandations récupérées avec succès", data: [] }, { status: 200 })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des recommandations" }, { status: 500 })
  }
}
