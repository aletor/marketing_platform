import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing render id" }, { status: 400 });
    }

    const SHOTSTACK_API_KEY = "AopRzYcdrOvYEm15EpcEm5dIROxx7YZg8pSas8GT";
    const res = await fetch(`https://api.shotstack.io/edit/stage/render/${id}`, {
      method: "GET",
      headers: {
        "x-api-key": SHOTSTACK_API_KEY
      }
    });

    if (!res.ok) {
      throw new Error(`Shotstack API Error: ${res.status}`);
    }

    const json = await res.json();
    
    // Status can be: 'queued', 'rendering', 'done', 'failed'
    const status = json.response.status;
    
    if (status === "done") {
      return NextResponse.json({ 
        status: "done", 
        url: json.response.url 
      });
    } else if (status === "failed") {
      return NextResponse.json({ 
        status: "failed", 
        error: json.response.error 
      });
    } else {
      return NextResponse.json({ 
        status: status 
      });
    }

  } catch (error: any) {
    console.error("Error checking render status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
