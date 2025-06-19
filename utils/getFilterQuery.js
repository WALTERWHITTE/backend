/**
 * Universal Filter Query Generator for Email Sending
 */
const getFilterQuery = ({ filterName, productId, ageComparator, ageValue }) => {
  if (!filterName) return null;

  const baseSelect = `
    SELECT 
      cd.clientId,
      cd.clientName AS clientName,
      cd.clientEmail AS clientEmail,
      GROUP_CONCAT(p.productName SEPARATOR ', ') AS clientProducts,
      cd.clientGender,
      cd.clientDob AS clientDOB,
      cd.familyHead
    FROM clientDetails cd
    LEFT JOIN clientProducts cp ON cd.clientId = cp.clientId
    LEFT JOIN products p ON cp.productId = p.productId
  `;

  let whereClause = `WHERE cd.clientEmail IS NOT NULL`;

  switch (filterName) {
    case 'All clients':
      // No extra where
      break;

    case 'Family heads':
      whereClause += ` AND cd.familyHead = 1`;
      break;

    case 'Male clients':
      whereClause += ` AND cd.clientGender = 'Male'`;
      break;

    case 'Female clients':
      whereClause += ` AND cd.clientGender = 'Female'`;
      break;

    case 'All clients with product':
      if (!productId) return null;
      whereClause += ` AND cp.productId = ${productId}`;
      break;

    case 'Family heads with product':
      if (!productId) return null;
      whereClause += ` AND cd.familyHead = 1 AND cp.productId = ${productId}`;
      break;

    case 'Male clients with product':
      if (!productId) return null;
      whereClause += ` AND cd.clientGender = 'Male' AND cp.productId = ${productId}`;
      break;

    case 'Female clients with product':
      if (!productId) return null;
      whereClause += ` AND cd.clientGender = 'Female' AND cp.productId = ${productId}`;
      break;

    case 'All clients by age':
      if (!ageComparator || ageValue == null) return null;
      whereClause += ` AND TIMESTAMPDIFF(YEAR, cd.clientDob, CURDATE()) ${ageComparator} ${ageValue}`;
      break;

    case 'Family heads by age':
      if (!ageComparator || ageValue == null) return null;
      whereClause += ` AND cd.familyHead = 1 AND TIMESTAMPDIFF(YEAR, cd.clientDob, CURDATE()) ${ageComparator} ${ageValue}`;
      break;

    case 'Male clients by age':
      if (!ageComparator || ageValue == null) return null;
      whereClause += ` AND cd.clientGender = 'Male' AND TIMESTAMPDIFF(YEAR, cd.clientDob, CURDATE()) ${ageComparator} ${ageValue}`;
      break;

    case 'Female clients by age':
      if (!ageComparator || ageValue == null) return null;
      whereClause += ` AND cd.clientGender = 'Female' AND TIMESTAMPDIFF(YEAR, cd.clientDob, CURDATE()) ${ageComparator} ${ageValue}`;
      break;

    case 'Clients who celebrate birthday':
      whereClause += ` AND DAY(cd.clientDob) = DAY(CURDATE()) AND MONTH(cd.clientDob) = MONTH(CURDATE())`;
      break;

    default:
      return null;
  }

  const query = `${baseSelect} ${whereClause} GROUP BY cd.clientId`;
  return { query, filter: filterName };
};

module.exports = { getFilterQuery };
