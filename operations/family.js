const mysql = require('mysql2/promise');
const { logActivity } = require('../utils/logActivity');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'UnifiedMessaging',
});

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });

const withRetryTransaction = async (callback) => {
  const MAX_RETRIES = 3;
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();
      await callback(conn);
      await conn.commit();
      conn.release();
      return;
    } catch (err) {
      await conn.rollback();
      conn.release();
      attempt++;
      if (attempt >= MAX_RETRIES || err.code !== 'ER_LOCK_WAIT_TIMEOUT') throw err;
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
};

const validateClientAssignments = async (conn, clientIds, familyIdToIgnore = null) => {
  const [existingClients] = await conn.query(
    `SELECT clientId FROM clientDetails 
     WHERE clientId IN (?) AND (familyId IS NOT NULL AND familyId != ?)`,
    [clientIds, familyIdToIgnore || 0]
  );

  if (existingClients.length > 0) {
    const conflictIds = existingClients.map((row) => row.clientId);
    const error = new Error(`Client(s) already assigned to a different family: ${conflictIds.join(', ')}`);
    error.status = 409;
    throw error;
  }
};

const recalculateTotalMembers = async (conn, familyId) => {
  const [updated] = await conn.query(
    `SELECT COUNT(*) AS count FROM clientDetails WHERE familyId = ?`,
    [familyId]
  );
  const totalMembers = updated[0].count;

  await conn.query(
    `UPDATE family SET totalMembers = ?, updatedAt = NOW() WHERE familyId = ?`,
    [totalMembers, familyId]
  );
};

async function createFamily(currentUser, body) {
  const { familyName, familyAddress, familyHeadId, clientIds = [] } = body;

  if (!familyName || !familyAddress) {
    const error = new Error('Missing required fields: familyName or familyAddress');
    error.status = 400;
    throw error;
  }

  const totalMembers = clientIds.filter(id => id !== null).length;

  await withRetryTransaction(async (conn) => {
    const [result] = await conn.query(
      `INSERT INTO family (familyName, familyAddress, familyHeadId, totalMembers, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [familyName, familyAddress, familyHeadId, totalMembers]
    );
    const familyId = result.insertId;

    const validClientIds = clientIds.filter(id => id !== null);

    if (validClientIds.length > 0) {
      await validateClientAssignments(conn, validClientIds);

      for (const clientId of validClientIds) {
        const isHead = clientId === familyHeadId ? 1 : 0;
        await conn.query(
          `UPDATE clientDetails SET familyId = ?, familyHead = ?, updatedAt = NOW() WHERE clientId = ?`,
          [familyId, isHead, clientId]
        );
      }
    }

    await logActivity(currentUser, 'CREATE', 'family', `Created family "${familyName}" with ID ${familyId}`);
  });

  return { message: 'Family created' };
}


async function viewFamilies(currentUser) {
  const [results] = await connection.query('SELECT * FROM family');
  await logActivity(currentUser, 'READ', 'family', 'Viewed all families');
  return results;
}

async function updateFamily(currentUser, body) {
  const { familyId, familyName, familyAddress, familyHeadId, clientIds = [] } = body;

  if (!familyId) {
    const error = new Error('familyId is required');
    error.status = 400;
    throw error;
  }

  // Filter valid (non-null) client IDs
  const validClientIds = Array.isArray(clientIds) ? clientIds.filter(id => id !== null) : [];

  await withRetryTransaction(async (conn) => {
    // Check for client conflicts only if assigning members
    if (validClientIds.length > 0) {
      await validateClientAssignments(conn, validClientIds, familyId);
    }

    // Update family info including totalMembers
    await conn.query(
      `UPDATE family SET familyName = ?, familyAddress = ?, familyHeadId = ?, totalMembers = ?, updatedAt = NOW()
       WHERE familyId = ?`,
      [familyName, familyAddress, familyHeadId, validClientIds.length, familyId]
    );

    // Unlink all existing members of this family
    await conn.query(
      `UPDATE clientDetails SET familyId = NULL, familyHead = 0, updatedAt = NOW() WHERE familyId = ?`,
      [familyId]
    );

    // Reassign selected clients to the family (with familyHead marked accordingly)
    for (const clientId of validClientIds) {
      const isHead = clientId === familyHeadId ? 1 : 0;
      await conn.query(
        `UPDATE clientDetails SET familyId = ?, familyHead = ?, updatedAt = NOW() WHERE clientId = ?`,
        [familyId, isHead, clientId]
      );
    }

    await logActivity(currentUser, 'UPDATE', 'family', `Updated family with ID ${familyId}`);
  });

  return { message: 'Family updated' };
}


async function deleteFamily(currentUser, body) {
  const { familyId } = body;

  if (!familyId) {
    const error = new Error('familyId is required');
    error.status = 400;
    throw error;
  }

  await withRetryTransaction(async (conn) => {
    await conn.query(`UPDATE clientDetails SET familyId = NULL, familyHead = 0, updatedAt = NOW() WHERE familyId = ?`, [familyId]);
    await conn.query(`DELETE FROM family WHERE familyId = ?`, [familyId]);
    await logActivity(currentUser, 'DELETE', 'family', `Deleted family with ID ${familyId}`);
  });

  return { message: 'Family deleted' };
}

module.exports = {
  createFamily,
  viewFamilies,
  updateFamily,
  deleteFamily,
  parseBody,
};
