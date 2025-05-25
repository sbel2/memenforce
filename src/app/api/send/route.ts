import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const GMAIL_USER = process.env.GMAIL_USER!;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD!;
const TO_EMAIL = process.env.TO_EMAIL!;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST() {
  try {
    console.log("🔄 Step 1: Fetching first family member from Supabase");

   const { data, error } = await supabase
    .from("family")
    .select("*")
    .order("ID", { ascending: true })
    .range(1, 1) // this gets only the second row (0-based index)
    .single();

    if (error || !data) throw new Error("Could not fetch data from Supabase");

    const { Name, Relationship, Context } = data;
    const userName = "John";

    const prompt = `
    Create an email reminder message for ${userName} about ${Name}, whose birthday is today. 
    ${Name} is his ${Relationship}. 

    This message is for ${userName} to gently remind them about this person’s birthday and who they are in their life. 
    Include some personal context to help them remember. 
    End with a kind nudge asking if they'd like to call or message ${Name} today.

    Respond in this format:
    Subject: <a short email subject>
    Message: <the full reminder body>
    Context: ${Context}
    `;

    console.log("🧠 Step 2: Sending prompt to Perplexity API");

    const perplexityResponse = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar-pro",
        messages: [
          { role: "system", content: "Return a subject and a short message." },
          { role: "user", content: prompt },
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

    const raw = perplexityResponse.data?.choices?.[0]?.message?.content || "";
    const subjectMatch = raw.match(/Subject:\s*(.*)/i);
    const messageMatch = raw.match(/Message:\s*([\s\S]*)/i);

    const subject = subjectMatch?.[1]?.trim() || "Birthday Reminder 🎂";
    const message = messageMatch?.[1]?.trim() || `Hi John, today is ${Name}’s birthday.`;

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
      subject,
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
