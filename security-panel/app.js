#!/usr/bin/env node

/**
 * Security Control Panel - Main Application
 * Terminal UI for managing security tools and commands
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class SecurityControlPanel {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.isAuthenticated = false;
    this.currentUser = null;
    this.sessionStartTime = null;
    this.auditLog = [];
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, 'config', 'security.config.json');
      const commandsPath = path.join(__dirname, 'config', 'commands.json');
      
      this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.commands = JSON.parse(fs.readFileSync(commandsPath, 'utf8'));
    } catch (err) {
      console.error(`${colors.red}Error loading config:${colors.reset}`, err.message);
      process.exit(1);
    }
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  clearScreen() {
    console.clear();
  }

  displayBanner() {
    this.clearScreen();
    this.log('╔════════════════════════════════��═══════════╗', 'cyan');
    this.log('║   SECURITY CONTROL PANEL v1.0              ║', 'cyan');
    this.log('║   Advanced Security Management System       ║', 'cyan');
    this.log('╚════════════════════════════════════════════╝', 'cyan');
    console.log('');
  }

  prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(`${colors.yellow}${question}${colors.reset}`, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async authenticate() {
    this.displayBanner();
    this.log('Authentication Required', 'yellow');
    console.log('');

    const masterPass = await this.prompt('Enter Master Passcode: ');
    
    if (masterPass === this.config.masterPasscode) {
      this.isAuthenticated = true;
      this.sessionStartTime = new Date();
      this.log('✓ Authentication Successful!', 'green');
      console.log('');
      return true;
    } else {
      this.log('✗ Invalid Passcode! Access Denied.', 'red');
      await this.delay(2000);
      return this.authenticate();
    }
  }

  displayMainMenu() {
    this.clearScreen();
    this.log('╔════════════════════════════════════════════╗', 'cyan');
    this.log('║         MAIN CONTROL PANEL                 ║', 'cyan');
    this.log('╚════════════════════════════════════════════╝', 'cyan');
    console.log('');
    
    this.log('Session Active - Authenticated', 'green');
    console.log('');
    
    this.log('[1] Execute Command', 'yellow');
    this.log('[2] View Available Tools', 'yellow');
    this.log('[3] View Audit Log', 'yellow');
    this.log('[4] System Status', 'yellow');
    this.log('[5] Settings', 'yellow');
    this.log('[6] Logout', 'yellow');
    console.log('');
  }

  displayTools() {
    this.clearScreen();
    this.log('╔════════════════════════════════════════════╗', 'cyan');
    this.log('║         AVAILABLE SECURITY TOOLS           ║', 'cyan');
    this.log('╚════════════════════════════════════════════╝', 'cyan');
    console.log('');

    this.commands.tools.forEach((tool, index) => {
      this.log(`[${index + 1}] ${tool.name}`, 'blue');
      this.log(`    Description: ${tool.description}`, 'white');
      this.log(`    Status: ${tool.active ? 'ACTIVE' : 'INACTIVE'}`, tool.active ? 'green' : 'red');
      this.log(`    Abilities: ${tool.abilities.join(', ')}`, 'cyan');
      console.log('');
    });
  }

  async executeCommand() {
    this.clearScreen();
    this.log('╔════════════════════════════════════════════╗', 'cyan');
    this.log('║         COMMAND EXECUTOR                   ║', 'cyan');
    this.log('╚════════════════════════════════════════════╝', 'cyan');
    console.log('');

    this.displayTools();

    const toolChoice = await this.prompt('Select Tool (number): ');
    const toolIndex = parseInt(toolChoice) - 1;

    if (toolIndex < 0 || toolIndex >= this.commands.tools.length) {
      this.log('✗ Invalid selection!', 'red');
      await this.delay(1500);
      return;
    }

    const selectedTool = this.commands.tools[toolIndex];

    if (!selectedTool.active) {
      this.log('✗ This tool is currently inactive!', 'red');
      await this.delay(1500);
      return;
    }

    this.log(`\nSelected Tool: ${selectedTool.name}`, 'yellow');
    console.log('');

    this.log('Available Commands:', 'cyan');
    selectedTool.commands.forEach((cmd, idx) => {
      this.log(`  [${idx + 1}] ${cmd.name} - ${cmd.description}`, 'white');
    });
    console.log('');

    const cmdChoice = await this.prompt('Select Command (number): ');
    const cmdIndex = parseInt(cmdChoice) - 1;

    if (cmdIndex < 0 || cmdIndex >= selectedTool.commands.length) {
      this.log('✗ Invalid command selection!', 'red');
      await this.delay(1500);
      return;
    }

    const selectedCommand = selectedTool.commands[cmdIndex];

    // Confirmation step
    console.log('');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
    this.log('EXECUTION CONFIRMATION', 'yellow');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
    this.log(`Tool: ${selectedTool.name}`, 'cyan');
    this.log(`Command: ${selectedCommand.name}`, 'cyan');
    this.log(`Risk Level: ${selectedCommand.riskLevel}`, selectedCommand.riskLevel === 'HIGH' ? 'red' : 'yellow');
    console.log('');

    const confirm = await this.prompt('Are you sure? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      this.log('✗ Command cancelled.', 'yellow');
      await this.delay(1500);
      return;
    }

    // Re-authenticate for critical operations
    if (selectedCommand.riskLevel === 'HIGH') {
      console.log('');
      this.log('High-Risk Operation - Re-authentication Required', 'red');
      const reauth = await this.prompt('Enter Master Passcode again: ');
      
      if (reauth !== this.config.masterPasscode) {
        this.log('✗ Authentication failed! Command blocked.', 'red');
        this.logAudit(selectedTool.name, selectedCommand.name, 'BLOCKED', 'Invalid re-authentication');
        await this.delay(2000);
        return;
      }
    }

    // Execute command
    console.log('');
    this.log('→ Executing command...', 'green');
    
    // Simulate command execution
    await this.simulateCommandExecution(selectedCommand);
    
    this.logAudit(selectedTool.name, selectedCommand.name, 'SUCCESS', 'Command executed successfully');
    
    this.log('✓ Command executed successfully!', 'green');
    await this.delay(2000);
  }

  async simulateCommandExecution(command) {
    // Simulate execution time
    for (let i = 0; i < 3; i++) {
      await this.delay(500);
      process.stdout.write('.');
    }
    console.log('');
  }

  displayAuditLog() {
    this.clearScreen();
    this.log('╔════════════════════════════════════════════╗', 'cyan');
    this.log('║            AUDIT LOG                       ║', 'cyan');
    this.log('╚════════════════════════════════════════════╝', 'cyan');
    console.log('');

    if (this.auditLog.length === 0) {
      this.log('No audit log entries yet.', 'yellow');
    } else {
      this.log('Recent Actions:', 'cyan');
      console.log('');
      
      this.auditLog.slice(-10).reverse().forEach((entry) => {
        const statusColor = entry.status === 'SUCCESS' ? 'green' : entry.status === 'BLOCKED' ? 'red' : 'yellow';
        this.log(`[${entry.timestamp}]`, 'white');
        this.log(`  Tool: ${entry.tool}`, 'cyan');
        this.log(`  Command: ${entry.command}`, 'cyan');
        this.log(`  Status: ${entry.status}`, statusColor);
        this.log(`  Details: ${entry.details}`, 'white');
        console.log('');
      });
    }

    this.prompt('Press Enter to continue...');
  }

  displaySystemStatus() {
    this.clearScreen();
    this.log('╔════════════════════════════════════════════╗', 'cyan');
    this.log('║         SYSTEM STATUS                      ║', 'cyan');
    this.log('╚════════════════════════════════════════════╝', 'cyan');
    console.log('');

    const activeTools = this.commands.tools.filter(t => t.active).length;
    const totalTools = this.commands.tools.length;
    const uptime = Math.floor((new Date() - this.sessionStartTime) / 1000);

    this.log(`Active Tools: ${activeTools}/${totalTools}`, 'green');
    this.log(`Session Uptime: ${uptime} seconds`, 'cyan');
    this.log(`Audit Entries: ${this.auditLog.length}`, 'yellow');
    this.log(`Security Level: ${this.config.securityLevel}`, 'blue');
    console.log('');

    this.log('Tool Status:', 'cyan');
    this.commands.tools.forEach((tool) => {
      const status = tool.active ? '✓ ONLINE' : '✗ OFFLINE';
      const color = tool.active ? 'green' : 'red';
      this.log(`  ${tool.name}: ${status}`, color);
    });
    console.log('');

    this.prompt('Press Enter to continue...');
  }

  logAudit(tool, command, status, details) {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      tool,
      command,
      status,
      details
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    await this.authenticate();

    let running = true;
    while (running) {
      this.displayMainMenu();
      const choice = await this.prompt('Enter your choice [1-6]: ');

      switch (choice) {
        case '1':
          await this.executeCommand();
          break;
        case '2':
          await this.displayTools();
          await this.prompt('Press Enter to continue...');
          break;
        case '3':
          await this.displayAuditLog();
          break;
        case '4':
          await this.displaySystemStatus();
          break;
        case '5':
          this.log('Settings feature coming soon!', 'yellow');
          await this.delay(1500);
          break;
        case '6':
          this.log('Logging out...', 'yellow');
          running = false;
          break;
        default:
          this.log('Invalid choice!', 'red');
          await this.delay(1000);
      }
    }

    this.log('Thank you for using Security Control Panel!', 'green');
    this.rl.close();
    process.exit(0);
  }
}

// Start the application
const app = new SecurityControlPanel();
app.run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
