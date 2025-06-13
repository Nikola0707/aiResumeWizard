import { User } from "@shared/schema";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
console.log("SLACK_WEBHOOK_URL on Render:", SLACK_WEBHOOK_URL);

export async function sendSlackNotification(user: User) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn("SLACK_WEBHOOK_URL not configured, skipping notification");
    return;
  }

  try {
    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎉 New User Registration",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Username:*\n${user.username}`,
            },
            {
              type: "mrkdwn",
              text: `*Name:*\n${user.name || "Not provided"}`,
            },
          ],
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Email:*\n${user.email || "Not provided"}`,
            },
            {
              type: "mrkdwn",
              text: `*Registration Date:*\n${user.createdAt.toLocaleString()}`,
            },
          ],
        },
      ],
    };

    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
  }
}
