import { NextResponse } from "next/server"
import axios from "axios"
import { PROVISIONING_API_URL, METAAPI_TOKEN } from "@/lib/metaapi"

export async function GET() {
  try {
    console.log("Testing MetaAPI connection...")

    // Make a direct request to test the connection
    const response = await axios.get(`${PROVISIONING_API_URL}/users/current`, {
      headers: {
        "auth-token": METAAPI_TOKEN,
        "Content-Type": "application/json",
      },
    })

    return NextResponse.json({
      success: true,
      message: "MetaAPI test successful",
      user: response.data,
    })
  } catch (error) {
    console.error("MetaAPI test error:", error)

    let errorMessage = "Unknown error testing MetaAPI connection"
    let errorDetails = {}

    if (axios.isAxiosError(error) && error.response) {
      errorMessage = `MetaAPI Error: ${error.response.status} ${JSON.stringify(error.response.data)}`
      errorDetails = {
        status: error.response.status,
        data: error.response.data,
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}

