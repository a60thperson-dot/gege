const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 5000;

// Simple in-memory storage as fallback for Railway
let inMemoryKeys = [];
let inMemoryProjects = {};

// Cloud storage - use tmp directory or current directory for Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT_NAME !== undefined;
const dataDir = isRailway ? '/tmp' : path.join(os.homedir(), 'AppData', 'Roaming', 'CaseFlowShared');

// Ensure data directory exists
if (!isRailway && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const accessKeysFile = path.join(dataDir, 'access-keys.json');
const projectsFile = path.join(dataDir, 'projects.json');

// Helper functions for file operations with fallback
const readAccessKeys = () => {
  try {
    if (fs.existsSync(accessKeysFile)) {
      const content = fs.readFileSync(accessKeysFile, 'utf-8').trim();
      if (content) return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading access keys:', e.message);
  }
  return inMemoryKeys;
};

const writeAccessKeys = (keys) => {
  inMemoryKeys = keys;
  try {
    fs.writeFileSync(accessKeysFile, JSON.stringify(keys, null, 2));
  } catch (e) {
    console.error('Error writing access keys:', e.message);
  }
};

const readProjects = () => {
  try {
    if (fs.existsSync(projectsFile)) {
      const content = fs.readFileSync(projectsFile, 'utf-8').trim();
      if (content) return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading projects:', e.message);
  }
  return inMemoryProjects;
};

const writeProjects = (projects) => {
  inMemoryProjects = projects;
  try {
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
  } catch (e) {
    console.error('Error writing projects:', e.message);
  }
};

// Initialize storage
if (!fs.existsSync(accessKeysFile)) {
  writeAccessKeys([]);
}
if (!fs.existsSync(projectsFile)) {
  writeProjects({});
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Register a new access key
app.post('/api/auth/register', (req, res) => {
  try {
    const { companyName, userName, accessKey } = req.body;
    
    if (!companyName || !accessKey) {
      return res.status(400).json({ error: 'Company name and access key are required' });
    }

    let accessKeysData = readAccessKeys();

    // Check if key already exists
    const exists = accessKeysData.some(k => k.companyName === companyName && k.accessKey === accessKey.toUpperCase());
    if (exists) {
      return res.status(400).json({ error: 'This access key is already registered' });
    }

    // Add new key
    accessKeysData.push({
      id: Date.now().toString(),
      companyName,
      userName: userName || 'Admin',
      accessKey: accessKey.toUpperCase(),
      createdDate: new Date().toISOString(),
      used: true
    });

    writeAccessKeys(accessKeysData);
    res.json({ success: true, message: 'Access key registered successfully' });
  } catch (error) {
    console.error('Error registering access key:', error);
    res.status(500).json({ error: 'Failed to register access key' });
  }
});

// Middleware to validate access key
const validateAccessKey = (req, res, next) => {
  const { company, accessKey } = req.body;
  
  if (!company || !accessKey) {
    return res.status(400).json({ error: 'Company name and access key are required' });
  }

  try {
    let accessKeysData = readAccessKeys();

    if (!accessKeysData || accessKeysData.length === 0) {
      return res.status(401).json({ error: 'No access keys configured. Register a key first using /api/auth/register' });
    }

    // Find the matching key
    const validKey = accessKeysData.find(k => 
      k.companyName === company && k.accessKey === accessKey.toUpperCase()
    );

    if (!validKey) {
      return res.status(401).json({ error: 'Invalid company name or access key' });
    }

    req.company = company;
    next();
  } catch (error) {
    console.error('Error validating access key:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Authenticate user (verify company + access key)
app.post('/api/auth/login', validateAccessKey, (req, res) => {
  try {
    const { company, accessKey } = req.body;
    
    // Return success with company info
    res.json({
      success: true,
      user: { 
        id: company, 
        company: company,
        accessKey: accessKey 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get projects for a company
app.post('/api/projects/get', validateAccessKey, (req, res) => {
  try {
    const data = readProjects();
    const company = req.company;
    res.json({ projects: data[company] || [] });
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// Save projects for a company
app.post('/api/projects/save', validateAccessKey, (req, res) => {
  try {
    const data = readProjects();
    const company = req.company;
    data[company] = req.body.projects;
    writeProjects(data);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving projects:', error);
    res.status(500).json({ error: 'Failed to save projects' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'online' });
});

app.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let ipAddress = 'localhost';
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ipAddress = iface.address;
        break;
      }
    }
  }
  
  console.log(`ProjectFlow Server running on http://${ipAddress}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Data directory: ${dataDir}`);
  console.log(`Environment: ${isRailway ? 'RAILWAY' : 'LOCAL'}`);
});
