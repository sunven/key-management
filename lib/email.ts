import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface InvitationEmailData {
  inviterName: string;
  inviterEmail: string;
  groupName: string;
  acceptUrl: string;
  rejectUrl: string;
}

/**
 * Generate HTML email template for share invitations
 */
export function invitationEmailTemplate(data: InvitationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
      background: #ffffff;
    }
    .group-name {
      font-size: 20px;
      font-weight: bold;
      color: #0ea5e9;
      margin: 20px 0;
      padding: 15px;
      background: #f0f9ff;
      border-radius: 8px;
      border-left: 4px solid #0ea5e9;
    }
    .buttons {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      margin: 8px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
    }
    .accept {
      background: #10b981;
      color: white;
    }
    .reject {
      background: #f3f4f6;
      color: #4b5563;
      border: 1px solid #d1d5db;
    }
    .footer {
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
      border-top: 1px solid #e5e7eb;
    }
    .warning {
      font-size: 12px;
      color: #6b7280;
      margin-top: 20px;
      padding: 15px;
      background: #fef3c7;
      border-radius: 8px;
    }
    @media only screen and (max-width: 600px) {
      .button {
        display: block;
        margin: 10px auto;
        width: 80%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Group 分享邀请</h1>
    </div>
    <div class="content">
      <p>您好，</p>
      <p><strong>${escapeHtml(data.inviterName)}</strong> (${escapeHtml(data.inviterEmail)}) 邀请您查看以下 Group：</p>
      <div class="group-name">📦 ${escapeHtml(data.groupName)}</div>
      <p>这是一个只读分享，您可以查看该 Group 中的所有配置项。</p>
      <div class="buttons">
        <a href="${data.acceptUrl}" class="button accept">接受邀请</a>
        <a href="${data.rejectUrl}" class="button reject">拒绝邀请</a>
      </div>
      <div class="warning">
        如果您不认识邀请者，请忽略此邮件或点击"拒绝邀请"。
      </div>
    </div>
    <div class="footer">
      <p>此邮件由 Key Management 系统自动发送</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Send an invitation email
 */
export async function sendInvitationEmail(
  to: string,
  data: InvitationEmailData,
): Promise<{ success: boolean; error?: string }> {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';

  try {
    const result = await resend.emails.send({
      from: `Key Management <${fromEmail}>`,
      to,
      subject: `${data.inviterName} 邀请您查看 Group: ${data.groupName}`,
      html: invitationEmailTemplate(data),
    });

    if (result.error) {
      console.error('Failed to send invitation email:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
