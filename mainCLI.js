const fs = require('fs');
const inquirer = require('inquirer');
const bcrypt = require('bcrypt');
const db = require('./db');
const { databaseOperationsMenu } = require('./databaseOperations');
const { runEmailMessaging } = require('./mailMessaging');
const { logActivity } = require('./utils/logActivity'); // Import the logActivity function
const { getCurrentUser } = require('./utils/auth'); // Import to get the current user, if needed

const SALT_ROUNDS = 10;

// Read users from users.json (optional fallback/local mirror)
const readUsers = () => {
  if (!fs.existsSync('./users.json')) fs.writeFileSync('./users.json', '[]');
  return JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
};

// Write users to users.json
const saveUsers = (users) => {
  fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
};

// Register function
const register = async () => {
  const { username, password } = await inquirer.prompt([
    { type: 'input', name: 'username', message: 'Choose a username:' },
    { type: 'password', name: 'password', message: 'Choose a password:', mask: '*' },
  ]);

  const [existing] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
  if (existing.length > 0) {
    console.log('Username already exists. Please login instead.\n');
    await logActivity(null, 'ERROR', 'users', `Attempted registration with an existing username: ${username}`);
    return login();
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

  // Get the new user's ID
  const userId = result.insertId;
  const currentUser = { userId, username };

  console.log('Registration successful. You can now log in.\n');
  await logActivity(currentUser, 'CREATE', 'users', `New user registered: ${username}`);

  return login();
};


// Login function
const login = async () => {
  const { username, password } = await inquirer.prompt([
    { type: 'input', name: 'username', message: 'Enter your username:' },
    { type: 'password', name: 'password', message: 'Enter your password:', mask: '*' },
  ]);

  const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

  if (rows.length === 0) {
    console.log('Invalid credentials. Please try again.\n');
    await logActivity(null, 'ERROR', 'users', `Failed login attempt with username: ${username}`);
    return login();
  }

  const validPassword = await bcrypt.compare(password, rows[0].password);
  if (!validPassword) {
    console.log('Invalid credentials. Please try again.\n');
    await logActivity(null, 'ERROR', 'users', `Failed login attempt with invalid password for username: ${username}`);
    return login();
  }

  console.log(`\nWelcome, ${username}!\n`);

  // Define currentUser object
  const currentUser = {
    userId: rows[0].userId, 
    username: rows[0].username,
  };

  // Log login action
  await logActivity(currentUser, 'LOGIN', 'users', `User ${username} logged in successfully.`);

  return mainMenu(currentUser);
};

// Initial screen
const start = async () => {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Welcome! Please choose an option:',
      choices: ['Register', 'Login', 'Exit'],
    },
  ]);

  if (choice === 'Register') {
    await register();
  } else if (choice === 'Login') {
    await login();
  } else {
    console.log('Goodbye!');
    process.exit();
  }
};

// Protected menu
const mainMenu = async (currentUser) => {
  try {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to do?',
        choices: ['Mail Messaging', 'Database Operations', 'Exit'],
      },
    ]);

    if (action === 'Mail Messaging') {
      await runEmailMessaging(mainMenu, currentUser);
      await logActivity(currentUser, 'ACTION', 'mailMessaging', `User ${currentUser.username} accessed the Mail Messaging system.`);
      await mainMenu(currentUser);
    } else if (action === 'Database Operations') {
      await databaseOperationsMenu(mainMenu, currentUser);
      await logActivity(currentUser, 'ACTION', 'databaseOperations', `User ${currentUser.username} accessed Database Operations.`);
    } else {
      console.log('Goodbye!');
      await logActivity(currentUser, 'LOGOUT', 'users', `User ${currentUser.username} logged out.`);
      process.exit();
    }
  } catch (err) {
    console.error('Error in main menu:', err);
    if (currentUser) {
      await logActivity(currentUser, 'ERROR', 'users', `Error encountered while using the system: ${err.message}`);
    }
    process.exit(1);
  }
};

start();
