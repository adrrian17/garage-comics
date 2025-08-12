import fs from "node:fs";
import csv from "csv-parser";
import { config } from "dotenv";
import Stripe from "stripe";

config();

const CSV_FILE_PATH = `./scripts/${process.argv[2]}` || "./products.csv";
const DRY_RUN = process.argv.includes("--dry-run");

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Error: STRIPE_SECRET_KEY environment variable is required");
  console.log(
    "💡 Make sure to set it in your .env file or as an environment variable",
  );
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function parseCSV(csvFilePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

// Validate CSV data
function validateProduct(product, index) {
  const errors = [];

  if (!product.name) {
    errors.push(`Row ${index + 2}: Product name is required`);
  }

  if (!product.price || Number.isNaN(Number(product.price))) {
    errors.push(`Row ${index + 2}: Valid price is required`);
  }

  if (!product.slug) {
    errors.push(`Row ${index + 2}: Slug is required`);
  }

  if (!product.account) {
    errors.push(`Row ${index + 2}: Account is required`);
  }

  if (!product.image) {
    errors.push(`Row ${index + 2}: Image is required`);
  }

  return errors;
}

async function createProduct(productData) {
  try {
    const product = await stripe.products.create({
      name: productData.name,
      images: [productData.image],
      metadata: {
        slug: productData.slug,
        account: productData.account,
      },
    });

    console.log(`✅ Created product: ${product.name} (${product.id})`);
    return product;
  } catch (error) {
    console.error(
      `❌ Error creating product ${productData.name}:`,
      error.message,
    );
    throw error;
  }
}

async function createPrice(productId, priceData) {
  try {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(Number(priceData.price) * 100), // Convert to cents
      currency: "mxn",
    });

    console.log(`✅ Created price: ${priceData.price} MXN (${price.id})`);
    return price;
  } catch (error) {
    console.error(
      `❌ Error creating price for product ${productId}:`,
      error.message,
    );
    throw error;
  }
}

async function setDefaultPrice(productId, priceId) {
  try {
    await stripe.products.update(productId, {
      default_price: priceId,
    });

    console.log(`✅ Default price set (${productId})`);
  } catch (error) {
    console.error(
      `❌ Error setting default price for product ${productId}:`,
      error.message,
    );
    throw error;
  }
}

async function main() {
  try {
    console.log("🚀 Starting CSV to Stripe import...\n");

    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`❌ Error: CSV file not found at ${CSV_FILE_PATH}`);
      console.log("\nExpected CSV format:");
      console.log("name,description,price,slug,account,image");
      console.log(
        "Comic Book 1,Description of comic,25.00,comic-1,acct_123,https://example.com/image1.jpg",
      );
      process.exit(1);
    }

    const products = await parseCSV(CSV_FILE_PATH);

    if (products.length === 0) {
      console.error("❌ Error: No products found in CSV file");
      process.exit(1);
    }

    console.log(`📄 Found ${products.length} products in CSV file`);

    let hasErrors = false;
    products.forEach((product, index) => {
      const errors = validateProduct(product, index);
      if (errors.length > 0) {
        hasErrors = true;
        errors.forEach((error) => console.error(`❌ ${error}`));
      }
    });

    if (hasErrors) {
      console.log("\n❌ Please fix validation errors before continuing");
      process.exit(1);
    }

    if (DRY_RUN) {
      console.log(
        "\n🔍 DRY RUN - No actual products will be created in Stripe\n",
      );
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ${product.price} MXN`);
      });
      console.log("\nRun without --dry-run to create products in Stripe");
      return;
    }

    console.log("\n📦 Creating products and prices in Stripe...\n");

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const [index, productData] of products.entries()) {
      try {
        console.log(
          `Processing ${index + 1}/${products.length}: ${productData.name}`,
        );

        const product = await createProduct(productData);
        const price = await createPrice(product.id, productData);
        await setDefaultPrice(product.id, price.id);

        results.successful++;
        console.log("");
      } catch (error) {
        results.failed++;
        results.errors.push({
          product: productData.name,
          error: error.message,
        });
        console.log("");
      }
    }

    // Summary
    console.log("📊 Import Summary:");
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`❌ Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log("\n❌ Errors:");
      results.errors.forEach(({ product, error }) => {
        console.log(`  • ${product}: ${error}`);
      });
    }
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

main();
