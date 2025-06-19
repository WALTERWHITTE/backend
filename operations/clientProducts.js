const mysql = require('mysql2/promise');
const { logActivity } = require('../utils/logActivity');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'UnifiedMessaging',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// CREATE associations
async function createClientProduct(currentUser, clientId, productIds) {
  if (!clientId || !Array.isArray(productIds) || productIds.length === 0) {
    const error = new Error('Missing or invalid clientId or productIds');
    error.statusCode = 400;
    throw error;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const productId of productIds) {
      await conn.query(
        `INSERT INTO clientProducts (clientId, productId, createdAt, updatedAt)
         VALUES (?, ?, NOW(), NOW())`,
        [clientId, productId]
      );
    }

    await conn.commit();

    await logActivity(currentUser, 'CREATE', 'clientProducts', `Linked products ${productIds.join(', ')} to client ID ${clientId}`);

    return { message: 'Client-product associations created.' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// UPDATE associations (delete existing and re-add)
async function updateClientProduct(currentUser, clientId, productIds) {
  if (!clientId || !Array.isArray(productIds) || productIds.length === 0) {
    const error = new Error('Missing or invalid clientId or productIds');
    error.statusCode = 400;
    throw error;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query('DELETE FROM clientProducts WHERE clientId = ?', [clientId]);

    for (const productId of productIds) {
      await conn.query(
        `INSERT INTO clientProducts (clientId, productId, createdAt, updatedAt)
         VALUES (?, ?, NOW(), NOW())`,
        [clientId, productId]
      );
    }

    await conn.commit();

    await logActivity(currentUser, 'UPDATE', 'clientProducts', `Updated products ${productIds.join(', ')} for client ID ${clientId}`);

    return { message: 'Client-product associations updated.' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// DELETE specific association
async function deleteClientProduct(currentUser, clientId, productId) {
   if (!clientId) {
    const error = new Error('Missing clientId');
    error.statusCode = 400;
    throw error;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'DELETE FROM clientProducts WHERE clientId = ?',
      [clientId]
    );

    if (result.affectedRows === 0) {
      const error = new Error('No associations found for the given clientId');
      error.statusCode = 404;
      throw error;
    }

    await conn.commit();

    await logActivity(currentUser, 'DELETE', 'clientProducts', `Deleted all product associations for client ID ${clientId}`);

    return { message: `All client-product associations deleted for client ; ${clientId}` };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// VIEW all associations
async function viewClientProducts(currentUser) {
  const [results] = await pool.query(`
    SELECT cp.clientId, c.clientName, cp.productId, p.productName, cp.createdAt
    FROM clientProducts cp
    JOIN clientDetails c ON cp.clientId = c.clientId
    JOIN products p ON cp.productId = p.productId
  `);

  await logActivity(currentUser, 'READ', 'clientProducts', 'Viewed all associations');

  return results;
}

module.exports = {
  createClientProduct,
  updateClientProduct,
  deleteClientProduct,
  viewClientProducts,
};
