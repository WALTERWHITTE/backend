require('dotenv').config();

const http = require('http');
const url = require('url');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { parse } = require('url');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');


const db = require('./db');
const { logActivity } = require('./utils/logActivity');
const { getFilterQuery } = require('./utils/getFilterQuery');
const { generateToken, verifyToken } = require('./utils/auth');
const { transporter, prepareEmail } = require('./utils/emailUtils');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'UnifiedMessaging',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const {
  createClient, updateClient, deleteClient, viewFilteredClients, getFilteredClients
} = require('./operations/clientDetails');
const {
  createFamily, updateFamily, deleteFamily, viewFamilies
} = require('./operations/family');
const {
  createClientProduct, updateClientProduct, deleteClientProduct, viewClientProducts
} = require('./operations/clientProducts');
const {
  createProduct, updateProduct, deleteProduct, viewProducts
} = require('./operations/products');

const emailClients = new Set(); // Track SSE response objects

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_PASS || 'your_jwt_secret_here';

const parseBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    try {
      resolve(JSON.parse(body || '{}'));
    } catch (err) {
      reject(new Error('Invalid JSON'));
    }
  });
});

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  setCorsHeaders(res);
  res.end(JSON.stringify(data));
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}


function authenticateJWT(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or malformed');
  }
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, JWT_SECRET);
}

const authenticate = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
};

const handle = (fn) => async (req, res, currentUser, params) => {
  try {
    await fn(req, res, currentUser, params);
  } catch (err) {
    console.error('Error in handler:', err);
    await logActivity(currentUser, 'ERROR', 'server', err.message);

    // Only send error response if res is not finished yet
    if (!res.finished && !res.writableEnded) {
      sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
    } else {
      console.warn('Response already finished, cannot send error JSON');
    }
  }
};

const sendEmails = async (
  filterName,
  templateId,
  user,
  productIds = [],
  ageComparator,
  ageValue,
  sendEvent
) => {
  if (!Array.isArray(productIds)) {
  console.warn('⚠️ productIds is not an array:', productIds);
}

  console.log('🛠️ Debug Filter Inputs:', {
  filterName,
  productIds,
  ageComparator,
  ageValue
});

  const filterQuery = getFilterQuery({ filterName, productIds, ageComparator, ageValue });

  console.log('🛠️ Generated Query:', filterQuery);


  if (!filterQuery) {
    return { error: 'Invalid filter or missing parameters.' };
  }

  const { query } = filterQuery;

  const conn = await connection.getConnection();
  const [clients] = await conn.query(query);
  conn.release();

  if (clients.length === 0) {
    return { error: 'No clients found for the selected filter.' };
  }

  const success = [];
  const failed = [];

  const maxRetries = 10;
  const retryDelayMs = 2000;

  for (const client of clients) {
    const email = client.clientEmail;
    const name = client.clientName;
    const products = client.clientProducts;

    if (!email) {
      const reason = `Client ${name} has no email.`;
      failed.push({ email: 'N/A', error: reason });
      sendEvent?.({ name, email: 'N/A', status: 'failed', reason });
      continue;
    }

    let attempt = 0;
    let sent = false;

    while (!sent && attempt < maxRetries) {
      try {
        const mailOptions = await prepareEmail({ client, templateId });

        sendEvent?.({ name, email, status: 'sending', attempt: attempt + 1 });
        console.log(`📨 Sending email to ${name} (${email}), attempt ${attempt + 1}`);

        await transporter.sendMail(mailOptions);

        console.log(`✅ Successfully sent email to ${name} (${email})`);
        success.push(email);
        sent = true;

        await logActivity(
          user,
          'EMAIL',
          'sendEmails',
          `Email successfully sent to ${email} using template ${templateId} (filter: ${filterName})`
        );

        sendEvent?.({ name, email, status: 'sent' });
      } catch (err) {
        attempt++;

        if (err.message.includes("Template with ID")) {
          const reason = `Template ID ${templateId} does not exist.`;
          failed.push({ email, error: reason });
          sendEvent?.({ name, email, status: 'failed', reason });
          break;
        }

        if (err.message.includes("ETIMEDOUT")) {
          console.warn(`⚠️ Timeout for ${email}: attempt ${attempt} of ${maxRetries}`);
          if (attempt >= maxRetries) {
            const reason = `Failed to send after ${maxRetries} retries (timeout).`;
            failed.push({ email, error: reason });
            sendEvent?.({ name, email, status: 'failed', reason });
            break;
          }
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        } else {
          const reason = err.message;
          if (attempt >= maxRetries) {
            failed.push({ email, error: reason });
            sendEvent?.({ name, email, status: 'failed', reason });
          }
          console.error(`❌ Fatal error for ${email}: ${reason}`);
          break;
        }
      }
    }
  }

  return {
    total: clients.length,
    sent: success.length,
    failed: failed.length,
    log: clients.map(c => {
      const email = c.clientEmail;
      const name = c.clientName;

      if (success.includes(email)) return { name, email, status: 'sent' };

      const failure = failed.find(f => f.email === email);
      if (failure) return { name, email, status: 'failed', reason: failure.error };

      return { name, email, status: 'unknown' };
    })
  };
};


const dbRoutes = {
  'GET /clients': handle(async (req, res, user, params) => {
    const { query } = params;
    await logActivity(user, 'VIEW', 'clientDetails', `Viewed clients`);
    const data = await viewFilteredClients(user, query?.filter || null);
    sendJson(res, 200, data);
  }),
  'POST /clients': handle(async (req, res, user) => {
    const body = await parseBody(req);
    await logActivity(user, 'CREATE', 'clientDetails', `Created client: ${JSON.stringify(body)}`);
    const result = await createClient(user, body);
    sendJson(res, 201, result);
  }),
  'POST /clientsFilter': handle(async (req, res, user) => {
  const body = await parseBody(req); 

  await logActivity(user, 'FILTER', 'clientDetails', `Filtered clients with: ${JSON.stringify(body)}`);

  const result = await getFilteredClients(user, body); 

  sendJson(res, 200, result);
}),


  'PUT /clients/:id': handle(async (req, res, user, params) => {
    const { id } = params;
    const body = await parseBody(req);
    await logActivity(user, 'UPDATE', 'clientDetails', `Updated client ${id}`);
    const result = await updateClient(user, id, body);
    sendJson(res, 200, result);
  }),
  'DELETE /clients/:id': handle(async (req, res, user, params) => {
  const { id } = params;
  const result = await deleteClient(user, [id]); // wrap in array
  sendJson(res, 200, result);
}),

  'GET /families': handle(async (req, res, user) => {
    await logActivity(user, 'VIEW', 'family', 'Viewed families');
    const data = await viewFamilies(user);
    sendJson(res, 200, data);
  }),
  'POST /families': handle(async (req, res, user) => {
    const body = await parseBody(req);
    await logActivity(user, 'CREATE', 'family', `Created family: ${JSON.stringify(body)}`);
    const result = await createFamily(user, body);
    sendJson(res, 201, result);
  }),
  'PUT /families/:id': handle(async (req, res, user, params) => {
  const { id } = params;
  const body = await parseBody(req);
  body.familyId = id;
  const result = await updateFamily(user, body);
  await logActivity(user, 'UPDATE', 'family', `Updated family ${id}`);
  sendJson(res, 200, result);
}),

  'DELETE /families/:id': handle(async (req, res, user, params) => {
  const { id } = params;
  await logActivity(user, 'DELETE', 'family', `Deleted family ${id}`);
  const result = await deleteFamily(user, { familyId: id });
  sendJson(res, 200, result);
}),

  'GET /client-products': handle(async (req, res, user) => {
    await logActivity(user, 'VIEW', 'clientProducts', 'Viewed client products');
    const data = await viewClientProducts(user);
    sendJson(res, 200, data);
  }),
  'POST /client-products': handle(async (req, res, user) => {
  const body = await parseBody(req);
  await logActivity(user, 'CREATE', 'clientProducts', `Created client-product: ${JSON.stringify(body)}`);
  const result = await createClientProduct(user, body.clientId, body.productIds);
  sendJson(res, 201, result);
}),

'PUT /client-products/:id': handle(async (req, res, user) => {
  const body = await parseBody(req);
  await logActivity(user, 'UPDATE', 'clientProducts', `updated client-product: ${JSON.stringify(body)}`);
  const result = await updateClientProduct(user, body.clientId, body.productIds);
  sendJson(res, 200, result);
}),

 'DELETE /client-products/:id': handle(async (req, res, user, params) => {
  const { id } = params;
  await logActivity(user, 'DELETE', 'clientProducts', `Deleted all product associations for client ID: ${id}`);
  const result = await deleteClientProduct(user, Number(id));
  sendJson(res, 200, result);
}),


  'GET /products': handle(async (req, res, user) => {
    await logActivity(user, 'VIEW', 'products', 'Viewed products');
    const data = await viewProducts(user);
    sendJson(res, 200, data);
  }),
  'POST /products': handle(async (req, res, user) => {
  const body = await parseBody(req);
  await logActivity(user, 'CREATE', 'products', `requested product creation: ${JSON.stringify(body)}`);
  const result = await createProduct(user, body);
  sendJson(res, 201, result);
}),
  'PUT /products/:id': handle(async (req, res, user, params) => {
  const { id } = params;
  const body = await parseBody(req);
  const { productName } = body;

  if (!productName || !productName.trim()) {
    return sendJson(res, 400, { error: 'productName is required and cannot be empty.' });
  }

  await logActivity(user, 'UPDATE', 'products', `User requested update for product ID ${id} with new name: ${productName}`);

  const result = await updateProduct(user, Number(id), productName);

  sendJson(res, 200, result);
}),


  'DELETE /products/:id': handle(async (req, res, user, params) => {
  const { id } = params;
  const unlinkBeforeDelete = req.url.includes('unlinkBeforeDelete=true');
  await logActivity(user, 'DELETE', 'products', `User requested deletion of product ID ${id}, unlinkBeforeDelete=${unlinkBeforeDelete}`);
  const body = { productId: Number(id), unlinkBeforeDelete };
  const result = await deleteProduct(user, body);
  sendJson(res, 200, result);
}),

  'GET /health': async (req, res) => {
    sendJson(res, 200, { status: 'ok', uptime: process.uptime() });
  },
};

const userActivityRoutes = (handle) => ( {

  // ACTIVITY LOG ROUTES
  'GET /activity-log': handle(async (req, res, user) => {
    const [rows] = await connection.query('SELECT * FROM activity_log ORDER BY timestamp DESC');
    sendJson(res, 200, rows);
  }),

  'POST /activity-log': handle(async (req, res, user) => {
    const body = await parseBody(req);
    const { userId, action, description, username } = body;

    const [result] = await connection.query(
      'INSERT INTO activity_log (userId, action, description, username) VALUES (?, ?, ?, ?)',
      [userId || null, action, description, username || 'Unknown']
    );

    await logActivity(user, 'CREATE', 'activity_log', `Manually added log: ${JSON.stringify(body)}`);
    sendJson(res, 201, { success: true, insertedId: result.insertId });
  }),

  'PUT /activity-log/:id': handle(async (req, res, user, params) => {
    const { id } = params;
    const body = await parseBody(req);
    const { action, description } = body;

    await connection.query(
      'UPDATE activity_log SET action = ?, description = ? WHERE logId = ?',
      [action, description, id]
    );

    await logActivity(user, 'UPDATE', 'activity_log', `Updated log ${id}`);
    sendJson(res, 200, { success: true });
  }),

  'DELETE /activity-log': handle(async (req, res, user) => {
  await connection.query('DELETE FROM activity_log');

  await logActivity(user, 'DELETE', 'activity_log', 'Deleted all logs');
  sendJson(res, 200, { success: true });
}),


  // USERS ROUTES
  'GET /users': handle(async (req, res, user) => {
    await logActivity(user, 'VIEW', 'users', 'Viewed users');
    const [rows] = await connection.query('SELECT * FROM users');
    sendJson(res, 200, rows);
  }),

  'POST /users': handle(async (req, res, user) => {
    const body = await parseBody(req);
    const { username, password, email } = body;

    const [result] = await connection.query(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, password, email]
    );

    await logActivity(user, 'CREATE', 'users', `Created user: ${username}`);
    sendJson(res, 201, { success: true, insertedId: result.insertId });
  }),

  'PUT /users/:id': handle(async (req, res, user, params) => {
    const { id } = params;
    const body = await parseBody(req);
    const { username, email, password } = body;

    await connection.query(
      'UPDATE users SET username = ?, email = ?, password = ? WHERE userId = ?',
      [username, email, password, id]
    );

    await logActivity(user, 'UPDATE', 'users', `Updated user ${id}`);
    sendJson(res, 200, { success: true });
  }),

  'DELETE /users/:id': handle(async (req, res, user, params) => {
    const { id } = params;

    await connection.query('DELETE FROM users WHERE userId = ?', [id]);

    await logActivity(user, 'DELETE', 'users', `Deleted user ${id}`);
    sendJson(res, 200, { success: true });
  }),
});

const allUserActivityRoutes = userActivityRoutes(handle);

const templateRoutes = (handle) => ({
  // GET ALL TEMPLATES
  'GET /templates': handle(async (req, res, user) => {
    await logActivity(user, 'VIEW', 'templates', 'Viewed all templates');
    const [rows] = await connection.query('SELECT * FROM email_templates ORDER BY createdAt DESC');
    sendJson(res, 200, rows);
  }),

  // CREATE TEMPLATE
  'POST /templates': handle(async (req, res, user) => {
    const body = await parseBody(req);
    const { templateName, subject, content } = body;

    const [result] = await connection.query(
      'INSERT INTO email_templates (templateName, subject, content) VALUES (?, ?, ?)',
      [templateName, subject, content]
    );

    await logActivity(user, 'CREATE', 'templates', `Created template: ${templateName}`);
    sendJson(res, 201, { success: true, insertedId: result.insertId });
  }),

  // UPDATE TEMPLATE
  'PUT /templates/:id': handle(async (req, res, user, params) => {
    const { id } = params;
    const body = await parseBody(req);
    const { templateName, subject, content } = body;

    await connection.query(
      'UPDATE email_templates SET templateName = ?, subject = ?, content = ? WHERE templateId = ?',
      [templateName, subject, content, id]
    );

    await logActivity(user, 'UPDATE', 'templates', `Updated template ${id}`);
    sendJson(res, 200, { success: true });
  }),

  // DELETE TEMPLATE
  'DELETE /templates/:id': handle(async (req, res, user, params) => {
    const { id } = params;

    await connection.query('DELETE FROM email_templates WHERE templateId = ?', [id]);

    await logActivity(user, 'DELETE', 'templates', `Deleted template ${id}`);
    sendJson(res, 200, { success: true });
  }),
})

const TemplateRoutes = templateRoutes(handle);

const mailRoutes = {
  'POST /register': async (req, res) => {
    try {
      const { username, password } = await parseBody(req);
      const [existing] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
      if (existing.length > 0) {
        return sendJson(res, 400, { error: 'Username already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword]
      );
      const userId = result.insertId;
      await logActivity({ userId, username }, 'CREATE', 'users', `New user registered: ${username}`);
      sendJson(res, 201, { message: 'Registration successful' });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
  },

  'POST /login': async (req, res) => {
    try {
      const { username, password } = await parseBody(req);
      const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
      if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password))) {
        await logActivity(null, 'ERROR', 'users', `Failed login for ${username}`);
        return sendJson(res, 401, { error: 'Invalid credentials' });
      }
      const currentUser = { userId: rows[0].userId, username: rows[0].username };
      const token = generateToken(currentUser);
      await logActivity(currentUser, 'LOGIN', 'users', `User ${username} logged in successfully.`);
      sendJson(res, 200, {
        message: 'Login successful',
        token,
        userId: currentUser.userId,
        username: currentUser.username
      });
  
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
  },

  'GET /stream-mail-status': (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    res.write(':\n\n'); // Initial ping

    emailClients.add(res);

    const keepAlive = setInterval(() => {
      res.write(':\n\n'); // Keep-alive every 25s
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      emailClients.delete(res);
    });
  },


'POST /sendEmails': async (req, res) => {
  try {
    const user = authenticate(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized' });

    const body = await parseBody(req);
    const { filterName, templateId, productIds, ageComparator, ageValue } = body;

    if (!filterName || !templateId) {
      return sendJson(res, 400, { error: 'Missing filterName or templateId' });
    }

    const result = await sendEmails(
  filterName,
  templateId,
  user,
  productIds,
  ageComparator,
  ageValue,
  streamEmailLog,
  (event) => {
    // log it, send to SSE/WebSocket, or console
    console.log('📡 Mail Event:', event);
  }
);

    return sendJson(res, 200, result);

  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err.message });
  }
}

};

function streamEmailLog(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of emailClients) {
    client.write(data);
  }
}

function serveIndexHtml(res) {
  const filePath = path.join(__dirname, 'public', 'index.html'); // Adjust path if needed
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading index.html');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  });
}

const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  try {
    if (req.method === 'OPTIONS') {
      setCorsHeaders(res);
      res.writeHead(204);
      return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const method = req.method.toUpperCase();
    const pathname = parsedUrl.pathname;

    // ✅ Handle all mail routes (POST and GET)
    const mailRouteKey = `${method} ${pathname}`;
    if (mailRoutes[mailRouteKey]) {
      try {
        await mailRoutes[mailRouteKey](req, res);
      } catch (err) {
        console.error('Mail route error:', err);
        return sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
      }
      return;
    }

    // Handle /login and /register
if (pathname === '/login' && method === 'POST') {
  return await allUserActivityRoutes['POST /login'](req, res);
}

if (pathname === '/register' && method === 'POST') {
  return await allUserActivityRoutes['POST /register'](req, res);
}

const publicRouteKey = `${method} ${pathname}`;
if (allUserActivityRoutes[publicRouteKey]) {
  return await allUserActivityRoutes[publicRouteKey](req, res);
}

    // API route handling
    if (pathname.startsWith('/api/')) {
      let currentUser;
      try {
        currentUser = authenticateJWT(req);
      } catch (err) {
        return sendJson(res, 401, { error: 'Unauthorized', message: err.message });
      }

      const apiPath = pathname.slice(4);
      const parts = apiPath.split('/').filter(Boolean);
      const resource = `/${parts[0] || ''}`;
      const id = parts[1];
      const apiRouteKey = `${method} ${id ? resource + '/:id' : resource}`;

      const matchedRoute =
        dbRoutes[apiRouteKey] ||
        allUserActivityRoutes[apiRouteKey] ||
        TemplateRoutes[apiRouteKey];

      if (matchedRoute) {
        await matchedRoute(req, res, currentUser, {
          query: parsedUrl.query,
          id,
          pathname: apiPath,
        });
        return;
      }

      return sendJson(res, 404, { error: 'Not Found' });
    }

    // ✅ FALLBACK: Serve React app for all unknown frontend routes
// ✅ Serve React frontend for all unmatched GET routes
if (req.method === 'GET' &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/register') &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/static')
) {
  return serveIndexHtml(res);
}

return sendJson(res, 404, { error: 'Not Found' });

  } catch (err) {
    console.error('Server error:', err);
    return sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});


server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
