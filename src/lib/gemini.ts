import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Vite converts this

export async function analyzeMealImage(imageBase64: string, mimeType: string, remainingEnergy: number, remainingProtein: number, totalEnergy: number, totalProtein: number) {
  const prompt = `你是一个专业的儿科肾脏病营养助手。
请分析这张图片中的食物：
1. 识别图片中的主要食物成分。
2. 估算这份食物的大致蛋白质含量（克）和热量（千卡）。
3. 患儿今日的营养总额度为：热量 ${totalEnergy} kcal，蛋白质 ${totalProtein} g。
4. 患儿今日还剩余的营养额度为：热量 ${remainingEnergy} kcal，蛋白质 ${remainingProtein} g。
5. 请对比剩余的营养额度，并给出简短的膳食建议（例如如果超标，指出超标多少，并建议下一顿如何调整）。

要求：严禁废话，直接返回 JSON 格式数据：
{
  "food_items": ["食物A", "食物B"],
  "estimated_protein": 12.5,
  "estimated_energy": 300,
  "advice": "简短的中文膳食建议"
}
只有JSON，不要其他文本。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                 data: imageBase64,
                 mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
