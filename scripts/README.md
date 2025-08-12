# Scripts

## CSV to Stripe Import Script

Script to import products and prices to Stripe from a CSV file.

### Usage

1. **Set up environment variables:**
   
   Either create a `.env` file in the project root:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   ```
   
   Or export the environment variable:
   ```bash
   export STRIPE_SECRET_KEY="sk_test_..."
   ```

2. **Run the script:**
   ```bash
   # Dry-run mode (without creating actual products)
   node scripts/csv-to-stripe.js products.csv --dry-run
   
   # Create actual products in Stripe
   node scripts/csv-to-stripe.js products.csv
   ```

### CSV Format

The CSV file should have the following columns:

| Column | Description |
|--------|-------------|
| `name` | Product name |
| `description` | Product description |
| `price` | Product price (in decimal units, e.g., 25.00) |
| `slug` | Product slug (saved in metadata) |
| `account` | Stripe connected account ID (saved in metadata) |
| `image` | Image URL |

### CSV Example

```csv
name,description,price,slug,account,image
Classic Comic Book,A classic adventure comic book,25.00,comic-clasico,acct_example123,https://example.com/comic1.jpg
Special Manga,Special edition manga,30.50,manga-especial,acct_example456,https://example.com/manga1.jpg
```