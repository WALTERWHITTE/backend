const getFilterQuery = ({ filterName, productIds = [], ageComparator, ageValue }) => {
  if (!filterName) return null;

  console.log('📦 Received Filter:', { filterName, productIds, ageComparator, ageValue });

  const formatProductList = (ids) =>
    ids && ids.length > 0 ? `(${ids.map(Number).join(',')})` : null;

  const productList = formatProductList(productIds);

  const baseSelect = `
    SELECT 
      cd.clientId,
      cd.clientName AS clientName,
      cd.clientEmail AS clientEmail,
      GROUP_CONCAT(p.productName SEPARATOR ', ') AS clientProducts,
      cd.clientGender,
      cd.clientDob AS clientDOB,
      cd.clientProfession,
      cd.familyHead
    FROM clientDetails cd
    LEFT JOIN clientProducts cp ON cd.clientId = cp.clientId ${productList ? `AND cp.productId IN ${productList}` : ''}
    LEFT JOIN products p ON cp.productId = p.productId
  `;

  let whereClause = `WHERE cd.clientEmail IS NOT NULL`;

  // Filter conditions
  switch (filterName) {
    case 'All clients':
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
      if (!productList) return null;
      whereClause += ` AND cp.productId IS NOT NULL`;
      break;

    case 'Family heads with product':
      if (!productList) return null;
      whereClause += ` AND cd.familyHead = 1 AND cp.productId IS NOT NULL`;
      break;

    case 'Male clients with product':
      if (!productList) return null;
      whereClause += ` AND cd.clientGender = 'Male' AND cp.productId IS NOT NULL`;
      break;

    case 'Female clients with product':
      if (!productList) return null;
      whereClause += ` AND cd.clientGender = 'Female' AND cp.productId IS NOT NULL`;
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

  console.log('✅ Final Query:', query);
};



module.exports = { getFilterQuery };
