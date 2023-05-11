const express = require("express");
const layouts = require("express-ejs-layouts");
require("dotenv").config();
const db = require("./utils/db");

const app = express();
const port = process.env.NODE_ENV === "production" ? 5000 : 3000;
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

app.set("view engine", "ejs");
app.use(layouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let sql;
app.get("/product", (req, res) => {
  sql = `SELECT 
  product.id AS id,
  product.name AS name,
  product.price AS price,
  product.description AS description,
  GROUP_CONCAT(pc.id_category separator ", ") AS productTags,
  GROUP_CONCAT(category.name
      SEPARATOR ', ') AS category
FROM
  product
      JOIN
  product_category AS pc ON (id = pc.id_product)
      JOIN
  category ON (pc.id_category = category.id)
GROUP BY name`;
  db.query(sql, (err, result) => {
    if (err) {
      res.status(400).redirect("/product");
      throw err;
    }
    res.status(200).render("product", {
      data: result,
      title: "Product List",
      layout: "layouts/main",
    });
  });
});
app.get("/product/add", (req, res) => {
  res.status(200).render("add", { title: "Insert", layout: "layouts/main" });
});
app.post("/product/add", (req, res) => {
  const { name, price, description, category } = req.body;
  sql = `INSERT INTO product VALUES (0, '${name}', '${price}', '${description}')`;
  db.query(sql, (err, result) => {
    if (err) {
      res.status(400).redirect("/product");
      throw err;
    }
    const insertedId = result.insertId;
    const promises = category.map((selectedCategory) => {
      sql = `INSERT INTO product_category VALUES (${insertedId}, ${selectedCategory})`;
      return new Promise((resolve, reject) => {
        db.query(sql, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
    });
    Promise.all(promises)
      .then(res.redirect("/product"))
      .catch((err) => {
        throw err;
      });
  });
});
app.get("/product/delete/:id", (req, res) => {
  const id = req.params.id;
  sql = `DELETE FROM product_category WHERE product_category.id_product = ${id}`;
  db.query(sql, (err) => {
    if (err) throw err;
    sql = `DELETE FROM product WHERE id = ${id}`;
    db.query(sql, (err) => {
      if (err) throw err;
      res.redirect("/product");
    });
  });
});
app.get("/product/update/:id", (req, res) => {
  const id = req.params.id;
  sql = `SELECT product.id AS id, product.name AS name, product.price AS price, product.description AS description, group_concat(pc.id_category separator ", ") AS productTags, GROUP_CONCAT(category.name SEPARATOR ", ") AS category FROM product JOIN product_category AS pc ON (id = pc.id_product) JOIN category ON (pc.id_category = category.id) WHERE product.id = ${id} GROUP BY name`;
  db.query(sql, (err, result) => {
    if (err) {
      res.redirect("/product");
      throw err;
    }
    res.render("update", {
      title: "Update Product",
      layout: "layouts/main",
      data: result[0],
    });
  });
});
app.post("/product/update", (req, res) => {
  const { id, name, price, description, category } = req.body;
  sql = `DELETE FROM product_category WHERE id_product = ${id}`;
  db.query(sql, (err) => {
    if (err) throw err;
  });
  sql = `UPDATE product SET name = ${name}', price = '${price}', description = '${description}')`;
  db.query(sql, (err, result) => {
    let promises = category.map((tag) => {
      sql = `INSERT INTO product_category values (${id}, ${tag})`;
      return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
          if (err) reject(err);
          resolve();
        });
      });
    });
    Promise.all(promises).then(() => res.redirect("/product"));
  });
});
app.listen(port, host, () => console.log("app runnning"));
