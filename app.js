const express = require("express");
const layouts = require("express-ejs-layouts");
require("dotenv").config();
const db = require("./utils/db");

const app = express();
const port = process.env.NODE_ENV === "production" ? 3000 : 9099;
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

function sanitize(str) {
  return str.trim().replace(/\s+/g, "");
}

app.set("view engine", "ejs");
app.use(layouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function sanitize(str) {
  return str.trim().replace(/\s+/g, " ");
}

let sql;
app.get("/", (req, res) => {
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
app.get("/add", (req, res) => {
  res.status(200).render("add", { title: "Insert", layout: "layouts/main" });
});
app.post("/add", (req, res) => {
  const { name, price, description, category } = req.body;
  if (name === "" || price === "" || description === "" || !category) {
    return res.status(400).redirect("add");
  }

  sql = `INSERT INTO product VALUES (0, '${sanitize(name)}', '${sanitize(
    price
  )}', '${sanitize(description)}')`;
  db.query(sql, (err, result) => {
    if (err) {
      res.status(400).redirect("/");
      throw err;
    }
    const insertedId = result.insertId;
    if (!Array.isArray(category)) {
      sql = `INSERT INTO product_category VALUES (${insertedId}, ${category})`;
      db.query(sql, (err) => {
        if (err) throw err;
        return res.redirect("/");
      });
    } else {
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
        .then(res.redirect("/"))
        .catch((err) => {
          throw err;
        });
    }
  });
});

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  sql = `DELETE FROM product_category WHERE product_category.id_product = ${id}`;
  db.query(sql, (err) => {
    if (err) throw err;
    sql = `DELETE FROM product WHERE id = ${id}`;
    db.query(sql, (err) => {
      if (err) throw err;
      res.redirect("/");
    });
  });
});
app.get("/update/:id", (req, res) => {
  const id = req.params.id;
  sql = `SELECT product.id AS id, product.name AS name, product.price AS price, product.description AS description, group_concat(pc.id_category separator ", ") AS productTags, GROUP_CONCAT(category.name SEPARATOR ", ") AS category FROM product JOIN product_category AS pc ON (id = pc.id_product) JOIN category ON (pc.id_category = category.id) WHERE product.id = ${id} GROUP BY name`;
  db.query(sql, (err, result) => {
    if (err) {
      res.redirect("/");
      throw err;
    }
    res.render("update", {
      title: "Update Product",
      layout: "layouts/main",
      data: result[0],
    });
  });
});
app.post("/update", (req, res) => {
  const { id, name, price, description, category } = req.body;
  if (name === "" || price === "" || description === "" || !category) {
    return res.status(400).redirect(`/update/${id}`);
  }
  sql = `DELETE FROM product_category WHERE id_product = ${id}`;
  db.query(sql, (err) => {
    if (err) throw err;
    sql = `UPDATE product SET name = '${sanitize(name)}', price = '${sanitize(
      price
    )}', description = '${sanitize(description)}' WHERE id = '${id}'`;
    db.query(sql, (err, result) => {
      if (err) {
        res.status(400).redirect("/");
        throw err;
      }
      const insertedId = result.insertId;
      if (!Array.isArray(category)) {
        sql = `INSERT INTO product_category VALUES (${id}, ${category})`;
        db.query(sql, (err) => {
          if (err) throw err;
          return res.redirect("/");
        });
      } else {
        const promises = category.map((selectedCategory) => {
          sql = `INSERT INTO product_category VALUES (${id}, ${selectedCategory})`;
          return new Promise((resolve, reject) => {
            db.query(sql, (err) => {
              if (err) reject(err);
              resolve();
            });
          });
        });
        Promise.all(promises)
          .then(res.redirect("/"))
          .catch((err) => {
            throw err;
          });
      }
    });
  });
});
app.listen(port, host, () => console.log("app runnning"));
