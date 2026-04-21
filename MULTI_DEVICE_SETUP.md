# ProjectFlow - Multi-Device Setup Guide

## Quick Start (First Time Only)

### HOST MACHINE (where server runs):

1. **Fix Firewall** - Open PowerShell as Administrator and run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\fix-firewall.ps1
   ```
   This will:
   - ✓ Add firewall rules for port 5000
   - ✓ Show your IP address
   - ✓ Verify server is running

2. **Start the server**:
   ```
   npm run electron-dev
   ```
   or
   ```
   npm run dev
   ```

3. **First Launch**:
   - App shows setup wizard
   - Choose **HOST** mode
   - Server starts automatically

---

### CLIENT MACHINES (other devices):

1. **Test Connection First** (recommended):
   - On CLIENT machine, open PowerShell and run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\test-connection.ps1
   ```
   - Enter HOST IP: `192.168.100.99` (or your host's IP)
   - All 3 tests should pass ✓

2. **Launch App**:
   - Run `npm run electron-dev`
   - Click Settings ⚙️ if first time
   - Click **🔄 Reset Network Configuration**
   - Choose **CLIENT** mode
   - Enter HOST IP: `192.168.100.99`
   - Login with same company + access key as HOST

3. **Login**:
   - Company: `test11`
   - Access Key: `0SPX2JVWHDQBJER0MKLUY7`
   - Click **Sign In** (wait for it - don't spam click!)

---

## Troubleshooting

### "Server timeout" error
**Solution**: 
1. HOST machine: Run `fix-firewall.ps1` as Administrator
2. CLIENT machine: Run `test-connection.ps1` to diagnose

### "Cannot reach localhost"
**Solution**: 
- Click Settings ⚙️
- Click Reset Network Configuration
- Choose CLIENT mode
- Enter HOST IP (not localhost!)

### "Connection failed" on startup
**Check**:
1. Is the server running on HOST? (`npm run electron-dev`)
2. Are both devices on the same WiFi/network?
3. Is HOST IP correct?
4. Did HOST run `fix-firewall.ps1`?

---

## Network Setup

```
HOST MACHINE (192.168.100.99)
    ↓
    Server runs on port 5000
    ↓
    Other devices connect to http://192.168.100.99:5000

CLIENT MACHINE 1          CLIENT MACHINE 2
    ↓                          ↓
Connect to                 Connect to
192.168.100.99:5000        192.168.100.99:5000
    ↓                          ↓
Same login = Same projects = Synced data
```

---

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Multiple clicks needed | Button spam allowed | Already fixed - button disables during login |
| Server timeout | Firewall blocking port 5000 | Run `fix-firewall.ps1` on HOST |
| Cannot ping host | Wrong IP or different network | Check IP is correct, same WiFi |
| "localhost" error | CLIENT using localhost | Reset config, enter HOST IP |
| Projects not syncing | Not logged into same account | Use same company + access key |

---

## Getting Your IP Address

On HOST machine:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"}
```

Share this IP with other devices! Example: `192.168.100.99`

---

## Files in this folder

- `fix-firewall.ps1` - Run on HOST as Administrator to allow port 5000
- `test-connection.ps1` - Run on CLIENT to diagnose connection issues
- `.github/copilot-instructions.md` - Project setup notes
