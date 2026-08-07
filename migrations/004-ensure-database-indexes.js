export const up = async (db, client) => {
  console.log("Running migration: ensure database indexes (UP)");

  // 1. User Collection Indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ role: 1 });
  await db.collection('users').createIndex({ status: 1 });

  // 2. Task Collection Indexes
  await db.collection('tasks').createIndex({ project: 1 });
  await db.collection('tasks').createIndex({ project: 1, assignee: 1 });
  await db.collection('tasks').createIndex({ project: 1, status: 1 });
  await db.collection('tasks').createIndex({ assignee: 1, dueDate: 1 });

  // 3. Project Collection Indexes
  await db.collection('projects').createIndex({ creator: 1 });
  await db.collection('projects').createIndex({ members: 1 });

  // 4. Token Collection Indexes
  await db.collection('tokens').createIndex({ token: 1 }, { unique: true });
  await db.collection('tokens').createIndex({ expiresAt: 1 });
};

export const down = async (db, client) => {
  console.log("Running migration: ensure database indexes (DOWN)");

  // Safely drop non-unique performance indexes if rolling back
  await db.collection('users').dropIndex("role_1").catch(() => {});
  await db.collection('users').dropIndex("status_1").catch(() => {});

  await db.collection('tasks').dropIndex("project_1").catch(() => {});
  await db.collection('tasks').dropIndex("project_1_assignee_1").catch(() => {});
  await db.collection('tasks').dropIndex("project_1_status_1").catch(() => {});
  await db.collection('tasks').dropIndex("assignee_1_dueDate_1").catch(() => {});

  await db.collection('projects').dropIndex("creator_1").catch(() => {});
  await db.collection('projects').dropIndex("members_1").catch(() => {});

  await db.collection('tokens').dropIndex("expiresAt_1").catch(() => {});
};
