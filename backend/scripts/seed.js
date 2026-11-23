// Seeds DS Style categories + products from data/sample_products.json
// (imported from the t.me/DSstyles channel; images live in uploads/products/ds_*.jpg).
//
//   npm run seed            -> only seeds products if the products collection is empty
//   npm run seed -- --force -> deletes ALL products and re-inserts the samples
//
// Images point at backend/uploads/products/<file>, served by this API at /uploads.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Db_for_dsstyle";
const BASE_URL = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3040}`).replace(/\/+$/, "");
const FORCE = process.argv.includes("--force");

const { categories, products } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/sample_products.json"), "utf-8")
);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected: ${MONGO_URI}`);

  const Category = (await import("../models/category.js")).default;
  const Product = (await import("../models/product.js")).default;

  const existing = await Product.countDocuments();
  if (existing > 0 && !FORCE) {
    console.log(`${existing} products already exist - nothing changed (use --force to replace them).`);
    return;
  }
  if (existing > 0) {
    const { deletedCount } = await Product.deleteMany({});
    console.log(`Removed ${deletedCount} existing products.`);
  }

  // Categories: drop ones not in the seed file (only reached on an empty DB or --force), then upsert.
  const keep = categories.map((c) => c._id);
  const { deletedCount: removedCats } = await Category.deleteMany({ _id: { $nin: keep } });
  for (const c of categories) {
    await Category.updateOne({ _id: c._id }, { $set: { name: c.name } }, { upsert: true });
  }
  console.log(`Categories ready: ${categories.length}${removedCats ? ` (removed ${removedCats} old)` : ""}`);

  // Product.create runs the schema's pre-save hook, which keeps the stock fields in sync.
  for (const p of products) {
    await Product.create({
      name: p.name,
      price: p.price,
      amount: p.amount,
      volume: p.amount,
      category: p.category,
      description: p.description || `${p.name} from DS Style.`,
      images: p.images.map((file) => `${BASE_URL}/uploads/products/${file}`),
      actualStock: p.stock,
      visibleStock: p.stock,
      isFeatured: Boolean(p.isFeatured),
      brand: "DS Style",
    });
  }
  console.log(`Seeded ${products.length} sample products (images from ${BASE_URL}/uploads/products).`);
}

seed()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
