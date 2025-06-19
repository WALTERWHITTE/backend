const mysql = require('mysql2/promise');
const { logActivity } = require('../utils/logActivity');
const { getFilterQuery } = require('../utils/getFilterQuery');
const db = require('../db');



const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'UnifiedMessaging',
});

function validateClientInput(client) {
  const errors = [];
  if (!client.name || client.name.trim() === '') errors.push('Name is required.');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(client.email)) errors.push('Invalid email format.');
  if (!/^\d{10}$/.test(client.contact)) errors.push('Contact should be a 10-digit number.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(client.dob) || isNaN(Date.parse(client.dob))) errors.push('DOB must be a valid date in YYYY-MM-DD format.');
  if (!['Male', 'Female'].includes(client.gender)) errors.push('Gender must be either "Male" or "Female".');
  return errors;
}

async function createClient(currentUser, client) {
  const errors = validateClientInput(client);
  if (errors.length) {
    const error = new Error('Validation failed');
    error.validationErrors = errors;
    throw error;
  }

  const [result] = await connection.query(
    `INSERT INTO clientDetails (clientName, clientEmail, clientContact, clientDob, clientProfession, clientGender, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [client.name, client.email, client.contact, client.dob, client.profession, client.gender]
  );

  await logActivity(currentUser, 'CREATE', 'clientDetails', `Created client "${client.name}" (ID: ${result.insertId})`);
  return { message: 'Client created successfully', clientId: result.insertId };
}

async function updateClient(currentUser, clientId, client) {
  const errors = validateClientInput(client);
  if (errors.length) {
    const error = new Error('Validation failed');
    error.validationErrors = errors;
    throw error;
  }

  const [result] = await connection.query(
    `UPDATE clientDetails SET clientName = ?, clientEmail = ?, clientContact = ?, clientDob = ?, clientProfession = ?, clientGender = ?, updatedAt = NOW() WHERE clientId = ?`,
    [client.name, client.email, client.contact, client.dob, client.profession, client.gender, clientId]
  );

  if (result.affectedRows === 0) {
    throw new Error('Client not found');
  }

  await logActivity(currentUser, 'UPDATE', 'clientDetails', `Updated client "${client.name}" (ID: ${clientId})`);
  return { message: 'Client updated successfully' };
}

async function deleteClient(currentUser, clientIds) {
  for (const clientId of clientIds) {
    const [clientRow] = await connection.query('SELECT clientName FROM clientDetails WHERE clientId = ?', [clientId]);
    const clientName = clientRow.length ? clientRow[0].clientName : 'Unknown';

    await connection.query('UPDATE family SET familyHeadId = NULL WHERE familyHeadId = ?', [clientId]);
    const [result] = await connection.query('DELETE FROM clientDetails WHERE clientId = ?', [clientId]);

    if (result.affectedRows === 0) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    await logActivity(currentUser, 'DELETE', 'clientDetails', `Deleted client "${clientName}" (ID: ${clientId})`);
  }

  return { message: 'Selected client(s) deleted' };
}

async function viewFilteredClients(currentUser, filter) {
  const {
    filterName,
    productId,
    ageComparator,
    ageValue,
  } = filter || {};

  let baseQuery = 'SELECT * FROM clientDetails';
  const filterClause = getFilterQuery({ filterName, productId, ageComparator, ageValue });

  if (filterClause) {
    baseQuery += ` ${filterClause}`;
  }

  try {
    const [results] = await connection.query(baseQuery);
    return results;
  } catch (error) {
    console.error('Error in viewFilteredClients:', error);
    throw error;
  }
}

async function getFilteredClients(user, filterParams) {
  const filterResult = getFilterQuery(filterParams);

  if (!filterResult || !filterResult.query) {
    return { error: 'Invalid or incomplete filter parameters' };
  }

  const [results] = await db.query(filterResult.query);
  return {
    filter: filterResult.filter,
    clients: results,
  };
}


module.exports = {
  createClient,
  updateClient,
  deleteClient,
  viewFilteredClients,
  getFilteredClients,
};
