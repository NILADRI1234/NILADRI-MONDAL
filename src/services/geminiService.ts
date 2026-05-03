import { GoogleGenAI } from "@google/genai";
import { LoanOffer, LoanProfile } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getAIBestChoice(offers: LoanOffer[], profile: LoanProfile): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return "AI insights currently unavailable. Please check configuration.";
  }

  const prompt = `
    You are a professional financial advisor specializing in the Indian banking market. Analyze these car loan offers for a customer:
    
    Customer Profile:
    - Monthly Income: ₹${profile.monthlyIncome.toLocaleString('en-IN')}
    - Car Price: ₹${profile.carPrice.toLocaleString('en-IN')}
    - Loan Amount: ₹${profile.loanAmount.toLocaleString('en-IN')}
    - Tenure: ${profile.tenure} months
    - CIBIL Score: ${profile.cibilScore}
    
    Available Offers:
    ${offers.filter(o => o.eligible).map(o => `
      - Bank: ${o.bankName}
      - Interest Rate: ${o.interestRate}% P.A.
      - Monthly EMI: ₹${o.monthlyEMI.toFixed(2)}
      - Total Interest over tenure: ₹${o.totalInterest.toFixed(2)}
    `).join('\n')}
    
    Provide a concise (2-3 sentence) recommendation on which bank is best for this specific Indian user. 
    Mention benefits like SBI's low rate or HDFC's processing speed if applicable.
    Focus on long-term savings (total interest) vs monthly convenience.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "No recommendation generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI recommendation. Try again later.";
  }
}
