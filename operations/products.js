const mysql = require('mysql2/promise');
const { logActivity } = require('../utils/logActivity');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'UnifiedMessaging',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Validation helper
const validateProductName = (name) => {
  if (!name || !name.trim()) {
    const error = new Error('Product name cannot be empty.');
    error.status = 400;
    throw error;
  }
};

const createProduct = async (currentUser, body) => {
  const { productName } = body;
  validateProductName(productName);

  await connection.query('INSERT INTO products (productName) VALUES (?)', [productName.trim()]);
  await logActivity(currentUser, 'CREATE', 'products', `User created product "${productName.trim()}".`);

  return { message: 'Product added.' };
};

const updateProduct = async (currentUser, productId, newName) => {
  if (!productId || !newName || !newName.trim()) {
    const error = new Error('Product ID and new name are required.');
    error.status = 400;
    throw error;
  }

  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    const [[old]] = await conn.query('SELECT productName FROM products WHERE productId = ?', [productId]);
    if (!old) {
      const error = new Error(`Product with ID ${productId} not found.`);
      error.status = 404;
      throw error;
    }

    await conn.query('UPDATE products SET productName = ? WHERE productId = ?', [newName.trim(), productId]);
    await logActivity(currentUser, 'UPDATE', 'products', `User updated product "${old.productName}" to "${newName.trim()}".`);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return { message: `Product ID ${productId} updated successfully.` };
};

const deleteProduct = async (currentUser, body) => {
  const { productId, unlinkBeforeDelete = false } = body;

  if (!productId) {
    const error = new Error('productId is required.');
    error.status = 400;
    throw error;
  }

  const [[product]] = await connection.query('SELECT productId, productName FROM products WHERE productId = ?', [productId]);
  if (!product) {
    const error = new Error('Product not found.');
    error.status = 404;
    throw error;
  }

  const [associatedClients] = await connection.query('SELECT clientId FROM clientProducts WHERE productId = ?', [productId]);

  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    if (associatedClients.length > 0) {
      if (unlinkBeforeDelete) {
        await conn.query('DELETE FROM clientProducts WHERE productId = ?', [productId]);
        await logActivity(currentUser, 'DELETE', 'products', `User unlinked product "${product.productName}" from clients.`);
      } else {
        const error = new Error('Product is associated with clients. Set unlinkBeforeDelete to true to unlink before deletion.');
        error.status = 400;
        throw error;
      }
    }

    await conn.query('DELETE FROM products WHERE productId = ?', [productId]);
    await conn.commit();

    await logActivity(currentUser, 'DELETE', 'products', `User  deleted product "${product.productName}".`);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return { message: 'Product deleted.' };
};

const viewProducts = async (currentUser) => {
  const [results] = await connection.query('SELECT * FROM products');
  if (results.length === 0) {
    return { message: 'No products found.', products: [] };
  }
  return { products: results };
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  viewProducts,
};
