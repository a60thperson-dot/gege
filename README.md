# ProjectFlow - Case Management App

A desktop application for managing projects and cases, built with Electron and Next.js with **multi-device sync support**.

## Features

- Add and manage projects with client information
- View and manage cases across your team
- Dark purple theme with modern UI and animations
- **Multi-device sync** - Login from multiple devices and see the same projects
- File attachment support
- Multi-language support (English/Arabic)
- Runs as a standalone exe application

## Quick Start

**First time setup?** See [MULTI_DEVICE_SETUP.md](./MULTI_DEVICE_SETUP.md) for detailed instructions!

### Installation

1. Ensure you have Node.js installed (version 18 or higher)
2. Install dependencies:
   ```
   npm install
   ```

## Development

Run the app in development mode:
```
npm run electron-dev
```

## Building the App

To package the app for Windows:
```
npm run package
```

The packaged Windows app will be created in the `dist` folder, inside a subfolder named `ProjectFlow-win32-x64`.

## Multi-Device Setup

For teams using ProjectFlow on multiple computers:

1. **HOST machine** (runs the server):
   - Choose HOST mode on first launch
   - Run `fix-firewall.ps1` to allow port 5000 through Windows Firewall
   - Share your IP with team members

2. **CLIENT machines** (connect to HOST):
   - Choose CLIENT mode on first launch
   - Enter the HOST's IP address
   - Login with same account as HOST
   - All projects will sync automatically

See [MULTI_DEVICE_SETUP.md](./MULTI_DEVICE_SETUP.md) for detailed troubleshooting and setup instructions.

## Usage

- Login with company name and access key
- Add projects with client information
- Attach files to projects
- Projects sync across all devices using the same account
- Click "View" to see details, "Delete" to remove
- Switch languages using the language selector

Data is stored locally on your computer.