import { NextResponse } from "next/server"
import { PROVISIONING_API_URL, METAAPI_TOKEN } from "@/lib/metaapi"

export async function GET() {
  try {
    console.log("Making direct test request to MetaAPI...")

    // Make a direct fetch request to the MetaAPI
    const response = await fetch(`${PROVISIONING_API_URL}/users/current`, {
      method: "GET",
      headers: {
        "auth-token": METAAPI_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`MetaAPI Error: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "MetaAPI direct test successful",
      user: data,
    })
  } catch (error) {
    console.error("MetaAPI direct test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error in direct MetaAPI test",
        errorObject: JSON.stringify(error),
      },
      { status: 500 },
    )
  }
}

