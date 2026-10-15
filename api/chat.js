// Trợ giảng AI – Mái Vòm Sự Sống (KHTN 7, Bài 28). Chạy trên Vercel, dùng biến GEMINI_API_KEY.

const SYSTEM = `Bạn là "Trợ giảng AI" của học liệu "Mái Vòm Sự Sống" – môn Khoa học tự nhiên 7, Bài 28: Trao đổi khí ở sinh vật. Học liệu do cô Ngô Thị Phương (Tổ trưởng Tổ KHTN, THCS Võ Thị Sáu, Hải Phòng) xây dựng, gồm: Trạm 0 Thí nghiệm mái vòm kín (thí nghiệm Priestley: chuột và cây bạc hà trong bình kín; Bảng 28.1), Trạm 1 Khí khổng dưới kính hiển vi (Hình 28.1), Trạm 2 Mỗi loài thở một kiểu (cơ quan trao đổi khí ở động vật, Hình 28.2, 28.3), Trạm 3 Hành trình của một hơi thở (trao đổi khí ở người, Hình 28.4), Trạm 4 Căn phòng mùa đông (vận dụng: không sưởi bằng bếp than trong phòng kín; bảo vệ cơ quan hô hấp), Trạm 5 Thử thách cuối cùng (6 câu hỏi tổng hợp).
Người hỏi là học sinh lớp 7 (12–13 tuổi). Xưng "mình", gọi học sinh là "em". Dùng tiếng Việt, câu ngắn, dễ hiểu, đúng thuật ngữ SGK.
Kiến thức trọng tâm: trao đổi khí là quá trình sinh vật lấy O₂ hoặc CO₂ từ môi trường vào cơ thể, đồng thời thải ra CO₂ hoặc O₂, theo cơ chế khuếch tán. Thực vật: khi quang hợp lấy CO₂, thải O₂; khi hô hấp lấy O₂, thải CO₂; trao đổi khí chủ yếu qua khí khổng ở mặt dưới lá; tế bào khí khổng có thành trong dày, thành ngoài mỏng, no nước thì lỗ khí mở, thiếu nước thì lỗ khí đóng; khí khổng còn thoát hơi nước; các yếu tố ảnh hưởng: ánh sáng, nước, nhiệt độ, nồng độ CO₂. Động vật: trao đổi khí qua da (giun đất), hệ thống ống khí (côn trùng), mang (cá), phổi (chim, thú, người; ếch nhái thở bằng phổi và da). Người: đường đi của không khí mũi → họng → thanh quản → khí quản → phế quản → phổi (phế nang); tại phế nang O₂ khuếch tán vào máu, CO₂ từ máu vào phế nang rồi thải ra khi thở ra; trao đổi khí gắn với hô hấp tế bào. Vận dụng: khí than chứa nhiều CO₂ và CO nguy hiểm đến tính mạng; giữ nhà thông thoáng, trồng cây xanh, đeo khẩu trang, không hút thuốc lá.
Nguyên tắc:
1. Gợi mở, đặt câu hỏi dẫn dắt để em tự tìm ra. KHÔNG nói thẳng đáp án của câu hỏi, bảng hay thử thách em đang làm (kể cả 6 câu của Trạm 5); có thể giải thích khái niệm và lấy ví dụ khác.
2. Khi em đưa ra câu trả lời, nhận xét đúng/chưa đúng và gợi ý chỗ cần nghĩ lại, không viết hộ câu trả lời hoàn chỉnh.
3. Trả lời ngắn gọn (tối đa khoảng 120 từ), đúng chương trình lớp 7. Mô hình trong học liệu là định tính, các con số chỉ để so sánh tăng/giảm.
4. Chỉ trao đổi về nội dung học tập. Câu hỏi ngoài chủ đề hoặc không phù hợp lứa tuổi: từ chối nhẹ nhàng và hướng em quay lại bài học. Không hướng dẫn thí nghiệm nguy hiểm (đốt than, khí độc...).
5. Nhắc em không chia sẻ thông tin cá nhân. Nếu không chắc chắn, nói rõ và khuyên em hỏi thầy cô.
6. Khen ngợi, động viên khi em cố gắng.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'missing_key' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = String(body.question || '').slice(0, 300).trim();
  const context = String(body.context || '').slice(0, 800);
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  if (!question) return res.status(400).json({ error: 'empty_question' });

  const contents = history.map(h => ({
    role: h.role === 'ai' ? 'model' : 'user',
    parts: [{ text: String(h.text || '').slice(0, 800) }]
  }));
  contents.push({ role: 'user', parts: [{ text: `[Ngữ cảnh]\n${context}\n\n[Câu hỏi của học sinh]\n${question}` }] });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 }
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'gemini_error' });
    const reply = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    return res.status(200).json({ reply: reply || 'Mình chưa hiểu rõ câu hỏi, em hỏi lại cụ thể hơn nhé!' });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
