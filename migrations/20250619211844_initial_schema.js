/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function (knex) {
  // users table
  await knex.schema.createTable('users', (table) => {
    table.increments('userId').primary();
    table.string('username', 100).notNullable().unique();
    table.string('password', 255).notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });

  // activity_log table
  await knex.schema.createTable('activity_log', (table) => {
    table.increments('logId').primary();
    table.integer('userId').unsigned().references('userId').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.text('description').nullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.string('username', 255).nullable();
  });

  // products table
  await knex.schema.createTable('products', (table) => {
    table.increments('productId').primary();
    table.string('productName', 100).notNullable().unique();
  });

  // family table
  await knex.schema.createTable('family', (table) => {
    table.increments('familyId').primary();
    table.string('familyName', 255).nullable();
    table.integer('familyHeadId').unsigned().nullable().references('clientId').inTable('clientDetails').onDelete('SET NULL');
    table.integer('totalMembers').nullable();
    table.string('familyAddress', 255).nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  // clientDetails table
  await knex.schema.createTable('clientDetails', (table) => {
    table.increments('clientId').primary();
    table.string('clientName', 255).notNullable();
    table.string('clientEmail', 255).notNullable().unique();
    table.bigInteger('clientContact').nullable();
    table.date('clientDob').nullable();
    table.string('clientProfession', 255).nullable();
    table.integer('familyId').unsigned().nullable().references('familyId').inTable('family').onDelete('SET NULL');
    table.boolean('familyHead').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.enu('clientGender', ['Male', 'Female']).nullable();
  });

  // clientProducts table (many-to-many)
  await knex.schema.createTable('clientProducts', (table) => {
    table.integer('clientId').unsigned().notNullable().references('clientId').inTable('clientDetails').onDelete('CASCADE');
    table.integer('productId').unsigned().notNullable().references('productId').inTable('products').onDelete('CASCADE');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.primary(['clientId', 'productId']);
  });

  // templates table
  await knex.schema.createTable('templates', (table) => {
    table.increments('templateId').primary();
    table.string('templateName', 255).notNullable();
    table.text('content').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.string('subject', 255).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function (knex) {
  // Drop tables in reverse order of creation to respect FK constraints
  await knex.schema.dropTableIfExists('templates');
  await knex.schema.dropTableIfExists('clientProducts');
  await knex.schema.dropTableIfExists('clientDetails');
  await knex.schema.dropTableIfExists('family');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('activity_log');
  await knex.schema.dropTableIfExists('users');
};
