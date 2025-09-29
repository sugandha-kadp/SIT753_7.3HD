require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user');
const Module = require('./src/models/module');

const users = [
  {
    name: 'CourseFlow Instructor',
    email: 'instructor@example.com',
    password: 'Password123!',
    role: 'instructor',
    state: 'Victoria',
  },
  {
    name: 'Test Student',
    email: 'student@example.com',
    password: 'Password123!',
    role: 'student',
    state: 'Victoria',
  },
];

const modules = [
  {
    title: 'Foundations of Web Development',
    description: 'Learn the core building blocks of modern web apps, from semantic HTML to CSS layouts and interactive JavaScript patterns.',
    category: 'technology',
    role: 'foundation',
    visibility: 'public',
    isArchived: false,
    assets: [
      {
        type: 'text',
        title: 'Course Overview',
        text: 'Understand how the web works, key browser concepts, and how to structure projects for growth.',
      },
      {
        type: 'text',
        title: 'Hands-on Labs',
        text: 'Build responsive layouts, modular CSS, and progressively enhanced JavaScript widgets.',
      },
    ],
  },
  {
    title: 'Advanced Node.js APIs',
    description: 'Design and optimise production-grade REST APIs with Node.js, Express, and MongoDB best practices.',
    category: 'technology',
    role: 'advanced',
    visibility: 'public',
    isArchived: false,
    assets: [
      {
        type: 'text',
        title: 'Architecture Notes',
        text: 'Dive into layered architecture, error handling strategies, and observable services.',
      },
      {
        type: 'text',
        title: 'Performance Checklist',
        text: 'Caching, pagination, rate limiting, and profiling techniques for high-traffic APIs.',
      },
    ],
  },
  {
    title: 'DevOps Automation with CI/CD',
    description: 'Implement automated delivery pipelines, infrastructure as code, and continuous feedback for cloud deployments.',
    category: 'technology',
    role: 'intermediate',
    visibility: 'public',
    isArchived: false,
    assets: [
      {
        type: 'text',
        title: 'Pipeline Blueprint',
        text: 'Plan each stage from commit to deployment, including branch strategies and gating policies.',
      },
      {
        type: 'text',
        title: 'Tooling Guide',
        text: 'Use GitHub Actions, Docker, and Terraform to deliver resilient environments with confidence.',
      },
    ],
  },
];

async function seedUsers() {
  for (const account of users) {
    const existing = await User.findOne({ email: account.email });
    if (existing) {
      existing.name = account.name;
      existing.role = account.role;
      if (account.state) existing.state = account.state;
      existing.password = account.password; // triggers hash via pre-save
      await existing.save();
      console.log('Updated ' + account.email);
    } else {
      await User.create(account);
      console.log('Created ' + account.email);
    }
  }
}

async function seedModules() {
  for (const course of modules) {
    const payload = {
      description: course.description,
      category: course.category,
      role: course.role,
      visibility: course.visibility,
      isArchived: course.isArchived,
      assets: course.assets.map((asset) => ({ ...asset })),
      updatedAt: new Date(),
    };

    const result = await Module.findOneAndUpdate(
      { title: course.title },
      { $set: { title: course.title, ...payload } },
      { new: true, upsert: true, setDefaultsOnInsert: true, includeResultMetadata: true }
    );

    const wasInserted = result.lastErrorObject?.upserted;
    if (wasInserted) {
      console.log('Created module: ' + course.title);
    } else {
      console.log('Upserted module: ' + course.title);
    }
  }
}

async function runSeeding(options = {}) {
  const { reuseConnection = false } = options;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment.');
  }

  const shouldConnect = !reuseConnection && mongoose.connection.readyState !== 1;
  if (shouldConnect) {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  }

  await seedUsers();
  await seedModules();
  console.log('Seeding completed.');

  if (shouldConnect) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runSeeding()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exit(1);
    });
}

module.exports = { runSeeding };
