import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import axios from "axios";

const GMAIL_USER = process.env.GMAIL_USER!;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD!;
const TO_EMAIL = process.env.TO_EMAIL!; // Can be your Gmail or number@tmomail.net
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;

export async function POST() {
  try {
    console.log("🔄 Step 1: Starting birthday reminder flow");

    const name = "Alice Johnson";
    const relationship = "wife";
    const context = "Your wife of over 50 years. You met in college and went to Italy together in 1998.";
    const userName = "John";

    const prompt = `Create a brief and friendly reminder message for ${userName} about ${name}, whose birthday is today. She is his ${relationship}. Context: ${context}. The main structure is message is it is your ${relationship}'s birthday today, ${name}. Do you want to send her a message or call her?`;

    console.log("🧠 Step 2: Sending prompt to Perplexity API");

    const perplexityResponse = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar-pro",
        messages: [
          { role: "system", content: "Keep output under 160 characters." },
          { role: "user", content: prompt }
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("✅ Step 3: Received response from Perplexity");
    const message =
      perplexityResponse.data?.choices?.[0]?.message?.content?.trim() ||
      "Hi John, today is Alice's birthday.";

    console.log("📧 Step 4: Sending email via Gmail SMTP");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    const mailResult = await transporter.sendMail({
      from: `"Memforce" <${GMAIL_USER}>`,
      to: TO_EMAIL,
      subject: "", // Optional; leave blank for SMS gateways
      text: message,
    });

    console.log("✅ Step 5: Email sent:", mailResult.messageId);

    return NextResponse.json({ status: "sent", id: mailResult.messageId });
  } catch (error: any) {
    const errMsg = error?.response?.data || error.message || "Unknown error";
    console.error("❌ Error occurred:", errMsg);
    return NextResponse.json({ status: "error", message: errMsg }, { status: 500 });
  }
}
