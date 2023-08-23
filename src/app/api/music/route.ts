import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import Replicate from "replicate";
import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subcription";
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const User: any = await getCurrentUser();
    const body = await req.json();
    const { prompt } = body;
    if (!User) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!replicate.auth) {
      return new NextResponse("Replicate Api is not configured", {
        status: 500,
      });
    }
    if (!prompt) {
      return new NextResponse("Message is required", { status: 400 });
    }
    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    const response = await replicate.run(
      "riffusion/riffusion:8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
      {
        input: {
          prompt_a: prompt,
        },
      }
    );
    if (!isPro) {
      await incrementApiLimit();
    }
    return new NextResponse(JSON.stringify(response));
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
