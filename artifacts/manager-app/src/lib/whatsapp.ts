export interface HomeworkSharePayload {
  className: string;
  subject: string;
  content: string;
}

export function formatHomeworkMessage(payload: HomeworkSharePayload): string {
  const { className, subject, content } = payload;
  return [
    `📚 *Class Update — ${className}*`,
    ``,
    `*Topic:* ${subject}`,
    `*Details:*`,
    content,
    ``,
    `_Sent via Manager App_ ✏️`,
  ].join("\n");
}

export function shareToWhatsApp(payload: HomeworkSharePayload): void {
  const message = formatHomeworkMessage(payload);
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
}

// Future: replace shareToWhatsApp with an API call to a WhatsApp Business webhook
// export async function sendViaWhatsAppApi(phone: string, payload: HomeworkSharePayload) {
//   const message = formatHomeworkMessage(payload);
//   await fetch("/api/whatsapp/send", {
//     method: "POST",
//     body: JSON.stringify({ phone, message }),
//   });
// }
