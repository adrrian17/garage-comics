import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { render } from "@react-email/render";
import amqp from "amqplib";
import FormData from "form-data";
import fetch from "node-fetch";
import { Resend } from "resend";
import { DownloadReadyEmail } from "./emails/DownloadReady.js";
import { OrderConfirmationEmail } from "./emails/OrderConfirmation.js";
import type {
  EmailConfirmationData,
  OrderConfirmationData,
  OrderData,
  ProcessResult,
  WorkerConfig,
} from "./types.js";

// Configuration
const config: WorkerConfig = {
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
    queue: "orders",
    downloadsQueue: "confirmation_emails",
    confirmationsQueue: "confirmations",
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_BUCKET_NAME || "comics",
    endpoint: process.env.R2_ENDPOINT!,
  },
  api: {
    url: process.env.API_URL || "http://localhost:1234",
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
    fromEmail: process.env.FROM_EMAIL || "hola@garagecomics.mx",
  },
};

// Validate required environment variables
const requiredEnvVars = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_ENDPOINT",
  "RESEND_API_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

// Initialize Resend client
const resend = new Resend(config.resend.apiKey);

class OrderWorker {
  private connection: any = null;
  private channel: any = null;
  private readonly tmpDir: string;

  constructor() {
    this.tmpDir = path.join(__dirname, "..", "tmp");

    // Create tmp directory if it doesn't exist
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }
  }

  async connect(): Promise<boolean> {
    try {
      console.log("🔌 Connecting to RabbitMQ...");
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Ensure the queues exist
      await this.channel.assertQueue(config.rabbitmq.queue, { durable: true });
      await this.channel.assertQueue(config.rabbitmq.downloadsQueue, {
        durable: true,
      });
      await this.channel.assertQueue(config.rabbitmq.confirmationsQueue, {
        durable: true,
      });

      console.log("✅ Connected to RabbitMQ successfully");
      return true;
    } catch (error) {
      console.error(
        "❌ Failed to connect to RabbitMQ:",
        (error as Error).message,
      );
      return false;
    }
  }

  async downloadFromR2(slug: string): Promise<string> {
    try {
      console.log(`⬇️ Downloading PDF: ${slug}`);

      const command = new GetObjectCommand({
        Bucket: config.r2.bucketName,
        Key: `${slug}.pdf`,
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new Error(`No body in response for ${slug}`);
      }

      // Save to temporary file
      const filePath = path.join(this.tmpDir, `${slug}.pdf`);
      const writeStream = fs.createWriteStream(filePath);

      await new Promise<void>((resolve, reject) => {
        const stream = response.Body as NodeJS.ReadableStream;
        stream.pipe(writeStream).on("error", reject).on("finish", resolve);
      });

      console.log(`✅ Downloaded PDF: ${slug}`);
      return filePath;
    } catch (error) {
      console.error(
        `❌ Failed to download PDF ${slug}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  async processWithAPI(
    pdfPaths: string[],
    customerEmail: string,
    orderId: string,
  ): Promise<string> {
    try {
      console.log(`🔄 Processing ${pdfPaths.length} PDFs with API...`);

      const form = new FormData();

      // Add PDFs to form
      for (const pdfPath of pdfPaths) {
        form.append("pdfs", fs.createReadStream(pdfPath));
      }

      // Add metadata
      form.append("email", customerEmail);
      form.append("reference", orderId);

      const response = await fetch(`${config.api.url}/api/watermark`, {
        method: "POST",
        body: form,
        headers: form.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API responded with ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error("No response body from API");
      }

      // Save the ZIP response to a temporary file
      const zipPath = path.join(this.tmpDir, `processed_${orderId}.zip`);
      const writeStream = fs.createWriteStream(zipPath);

      await new Promise<void>((resolve, reject) => {
        const stream = response.body as NodeJS.ReadableStream;
        stream.pipe(writeStream).on("error", reject).on("finish", resolve);
      });

      console.log(`✅ PDFs processed successfully. ZIP saved to: ${zipPath}`);
      return zipPath;
    } catch (error) {
      console.error(
        "❌ Failed to process PDFs with API:",
        (error as Error).message,
      );
      throw error;
    }
  }

  async generatePresignedUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: "orders",
        Key: key,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      });

      console.log(
        `✅ Generated presigned URL for ${key} (expires in 24 hours)`,
      );
      return presignedUrl;
    } catch (error) {
      console.error(
        `❌ Failed to generate presigned URL for ${key}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  async uploadToR2(zipPath: string, orderId: string): Promise<string> {
    try {
      console.log(`⬆️ Uploading processed ZIP for order: ${orderId}`);

      const fileStream = fs.createReadStream(zipPath);
      const key = `${orderId}.zip`;

      const command = new PutObjectCommand({
        Bucket: "orders",
        Key: key,
        Body: fileStream,
        ContentType: "application/zip",
      });

      await s3Client.send(command);

      console.log(`✅ Uploaded processed ZIP: ${key}`);

      // Generate presigned URL that expires in 24 hours
      const presignedUrl = await this.generatePresignedUrl(key);

      return presignedUrl;
    } catch (error) {
      console.error(
        `❌ Failed to upload ZIP for order ${orderId}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  async sendEmailConfirmation(
    orderData: OrderData,
    presignedUrl: string,
  ): Promise<void> {
    try {
      console.log(
        `📧 Sending email confirmation for order: ${orderData.orderId}`,
      );

      const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();

      const confirmationData: EmailConfirmationData = {
        orderId: orderData.orderId,
        customerEmail: orderData.customerEmail,
        presignedUrl,
        expiresAt,
        items: orderData.items,
        total: orderData.total,
        timestamp: orderData.timestamp,
      };

      const message = JSON.stringify(confirmationData);

      this.channel.sendToQueue(
        config.rabbitmq.downloadsQueue,
        Buffer.from(message),
        { persistent: true },
      );

      console.log(
        `✅ Email confirmation queued for ${orderData.customerEmail}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to send email confirmation for order ${orderData.orderId}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  async generateEmailTemplate(emailData: EmailConfirmationData): Promise<{
    subject: string;
    html: string;
  }> {
    const subject = `¡Tu pedido #${emailData.orderId} está listo para descargar!`;

    // Transform the order items to match the DownloadReady template format
    const downloadItems = emailData.items.map((item) => ({
      productName: item.productSlug,
    }));

    const html = await render(
      DownloadReadyEmail({
        customerEmail: emailData.customerEmail,
        orderId: emailData.orderId,
        items: downloadItems,
        downloadUrl: emailData.presignedUrl,
      }),
    );

    return { subject, html };
  }

  async processEmailConfirmation(
    emailData: EmailConfirmationData,
  ): Promise<void> {
    try {
      console.log(
        `📧 Processing email confirmation for order: ${emailData.orderId}`,
      );

      const { subject, html } = await this.generateEmailTemplate(emailData);

      const result = await resend.emails.send({
        from: config.resend.fromEmail,
        to: emailData.customerEmail,
        subject,
        html,
      });

      if (result.error) {
        throw new Error(`Resend error: ${result.error.message}`);
      }

      console.log(`✅ Email sent successfully to ${emailData.customerEmail}`);
      console.log(`📬 Email ID: ${result.data?.id}`);
    } catch (error) {
      console.error(
        `❌ Failed to send email for order ${emailData.orderId}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  async processOrderConfirmation(
    confirmationData: OrderConfirmationData,
  ): Promise<void> {
    try {
      console.log(
        `📧 Processing order confirmation email for order: ${confirmationData.orderId}`,
      );

      const subject = `¡Gracias por tu pedido #${confirmationData.orderId}!`;

      const html = await render(
        OrderConfirmationEmail({
          customerEmail: confirmationData.customerEmail,
          customerName: confirmationData.customerName,
          orderId: confirmationData.orderId,
          items: confirmationData.items,
          total: confirmationData.total,
          paymentMethod: confirmationData.paymentMethod,
        }),
      );

      const result = await resend.emails.send({
        from: config.resend.fromEmail,
        to: confirmationData.customerEmail,
        subject,
        html,
      });

      if (result.error) {
        throw new Error(`Resend error: ${result.error.message}`);
      }

      console.log(
        `✅ Order confirmation email sent successfully to ${confirmationData.customerEmail}`,
      );
      console.log(`📬 Email ID: ${result.data?.id}`);
    } catch (error) {
      console.error(
        `❌ Failed to send order confirmation email for order ${confirmationData.orderId}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  async cleanupFiles(filePaths: string[]): Promise<void> {
    console.log(`🧹 Starting cleanup of ${filePaths.length} file(s)...`);

    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          fs.unlinkSync(filePath);
          console.log(
            `🗑️ Cleaned up: ${path.basename(filePath)} (${(stats.size / 1024).toFixed(1)} KB)`,
          );
        } else {
          console.log(
            `⚠️ File not found for cleanup: ${path.basename(filePath)}`,
          );
        }
      } catch (error) {
        console.warn(
          `❌ Failed to cleanup ${filePath}:`,
          (error as Error).message,
        );
      }
    }

    console.log(`✅ Cleanup completed`);
  }

  async cleanupOldFiles(): Promise<void> {
    try {
      console.log(`🧹 Cleaning up old temporary files...`);

      const files = fs.readdirSync(this.tmpDir);
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.tmpDir, file);
        const stats = fs.statSync(filePath);

        // Delete files older than 1 hour
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        if (stats.mtime.getTime() < oneHourAgo) {
          fs.unlinkSync(filePath);
          console.log(
            `🗑️ Removed old file: ${file} (${(stats.size / 1024).toFixed(1)} KB)`,
          );
          cleanedCount++;
        }
      }

      if (cleanedCount === 0) {
        console.log(`✅ No old files to clean`);
      } else {
        console.log(`✅ Cleaned up ${cleanedCount} old file(s)`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup old files:`, (error as Error).message);
    }
  }

  async processOrder(orderData: OrderData): Promise<ProcessResult> {
    const filesToCleanup: string[] = [];

    try {
      console.log(`\n📦 Processing order: ${orderData.orderId}`);
      console.log(`👤 Customer: ${orderData.customerEmail}`);
      console.log(`📄 Items: ${orderData.items.length}`);

      // Extract unique slugs from order items
      const slugs = [
        ...new Set(orderData.items.map((item) => item.productSlug)),
      ];
      console.log(`📋 Unique PDFs to process: ${slugs.join(", ")}`);

      // Download all PDFs from R2
      const pdfPaths: string[] = [];
      for (const slug of slugs) {
        const pdfPath = await this.downloadFromR2(slug);
        pdfPaths.push(pdfPath);
        filesToCleanup.push(pdfPath);
      }

      // Process PDFs with the Go API
      const zipPath = await this.processWithAPI(
        pdfPaths,
        orderData.customerEmail,
        orderData.orderId,
      );
      filesToCleanup.push(zipPath);

      // Upload processed ZIP to R2 and get presigned URL
      const presignedUrl = await this.uploadToR2(zipPath, orderData.orderId);

      // Send email confirmation with presigned URL
      await this.sendEmailConfirmation(orderData, presignedUrl);

      console.log(`🎉 Order processed successfully!`);
      console.log(`📁 ZIP available at: ${presignedUrl}`);
      console.log(`📧 Email confirmation sent to: ${orderData.customerEmail}`);

      return { success: true, presignedUrl };
    } catch (error) {
      console.error(
        `💥 Failed to process order ${orderData.orderId}:`,
        (error as Error).message,
      );
      return { success: false, error: (error as Error).message };
    } finally {
      // Always cleanup temporary files
      await this.cleanupFiles(filesToCleanup);
    }
  }

  async startProcessing(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized. Call connect() first.");
    }

    console.log(`🚀 Starting order processor worker...`);
    console.log(`📡 Listening to queues:`);
    console.log(`   - Orders: ${config.rabbitmq.queue}`);
    console.log(`   - Emails: ${config.rabbitmq.downloadsQueue}`);
    console.log(`   - Confirmations: ${config.rabbitmq.confirmationsQueue}`);

    // Clean up old temporary files on startup
    await this.cleanupOldFiles();

    // Set prefetch to 1 to process one order at a time
    await this.channel.prefetch(1);

    // Process orders
    this.channel.consume(config.rabbitmq.queue, async (msg: any) => {
      if (msg !== null) {
        try {
          const orderData: OrderData = JSON.parse(msg.content.toString());

          // Process the order
          const result = await this.processOrder(orderData);

          if (result.success) {
            // Acknowledge the message (remove from queue)
            this.channel!.ack(msg);
            console.log(`✅ Order ${orderData.orderId} acknowledged`);
          } else {
            // Reject the message and requeue it (or send to DLQ)
            console.log(`❌ Order ${orderData.orderId} rejected and requeued`);
            this.channel!.nack(msg, false, true);
          }
        } catch (error) {
          console.error(
            "💥 Error processing order message:",
            (error as Error).message,
          );
          // Reject and requeue the message
          this.channel!.nack(msg, false, true);
        }
      }
    });

    // Process email confirmations
    this.channel.consume(config.rabbitmq.downloadsQueue, async (msg: any) => {
      if (msg !== null) {
        try {
          const emailData: EmailConfirmationData = JSON.parse(
            msg.content.toString(),
          );

          // Process the email confirmation
          await this.processEmailConfirmation(emailData);

          // Acknowledge the message (remove from queue)
          this.channel!.ack(msg);
          console.log(
            `✅ Email confirmation ${emailData.orderId} acknowledged`,
          );
        } catch (error) {
          console.error(
            "💥 Error processing email confirmation:",
            (error as Error).message,
          );
          // Reject and requeue the message
          this.channel!.nack(msg, false, true);
        }
      }
    });

    // Process order confirmations
    this.channel.consume(
      config.rabbitmq.confirmationsQueue,
      async (msg: any) => {
        if (msg !== null) {
          try {
            const confirmationData: OrderConfirmationData = JSON.parse(
              msg.content.toString(),
            );

            // Process the order confirmation
            await this.processOrderConfirmation(confirmationData);

            // Acknowledge the message (remove from queue)
            this.channel!.ack(msg);
            console.log(
              `✅ Order confirmation ${confirmationData.orderId} acknowledged`,
            );
          } catch (error) {
            console.error(
              "💥 Error processing order confirmation:",
              (error as Error).message,
            );
            // Reject and requeue the message
            this.channel!.nack(msg, false, true);
          }
        }
      },
    );

    console.log("⏳ Waiting for orders to process...");
  }

  async shutdown(): Promise<void> {
    console.log("🛑 Shutting down worker...");

    if (this.channel) {
      await this.channel.close();
    }

    if (this.connection) {
      await this.connection.close();
    }

    console.log("👋 Worker shutdown complete");
  }
}

// Main execution
async function main(): Promise<void> {
  const worker = new OrderWorker();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Received SIGINT, shutting down gracefully...");
    await worker.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
    await worker.shutdown();
    process.exit(0);
  });

  // Connect and start processing
  const connected = await worker.connect();

  if (connected) {
    await worker.startProcessing();
  } else {
    console.error("❌ Failed to start worker");
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the worker
main().catch(console.error);
