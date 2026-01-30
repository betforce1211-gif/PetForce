#!/usr/bin/env node
/**
 * Bulk Import Issues to GitHub
 * Imports tasks from agent conversations or other sources
 * Usage: node bulk-import-issues.js <input-file.json>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Issue template
const ISSUE_TEMPLATE = {
  title: '',
  body: '',
  labels: [],
  assignees: [],
  milestone: null
};

// Agent to GitHub label mapping
const AGENT_LABELS = {
  peter: ['agent:peter', 'product'],
  engrid: ['agent:engrid', 'engineering'],
  tucker: ['agent:tucker', 'testing'],
  larry: ['agent:larry', 'observability'],
  dexter: ['agent:dexter', 'design'],
  samantha: ['agent:samantha', 'security'],
  chuck: ['agent:chuck', 'ci-cd'],
  maya: ['agent:maya', 'mobile'],
  axel: ['agent:axel', 'api'],
  buck: ['agent:buck', 'data'],
  ana: ['agent:ana', 'analytics'],
  isabel: ['agent:isabel', 'infrastructure'],
  thomas: ['agent:thomas', 'documentation'],
  casey: ['agent:casey', 'customer-success']
};

// Priority mapping
const PRIORITY_LABELS = {
  critical: ['priority:critical', 'severity:critical'],
  high: ['priority:high', 'severity:high'],
  medium: ['priority:medium', 'severity:medium'],
  low: ['priority:low', 'severity:low']
};

/**
 * Create a GitHub issue using gh CLI
 */
function createGitHubIssue(issue) {
  const labels = issue.labels.join(',');
  const assignees = issue.assignees.join(',');
  
  const cmd = [
    'gh', 'issue', 'create',
    '--title', `"${issue.title}"`,
    '--body', `"${issue.body}"`,
    labels ? `--label "${labels}"` : '',
    assignees ? `--assignee "${assignees}"` : '',
    issue.milestone ? `--milestone "${issue.milestone}"` : ''
  ].filter(Boolean).join(' ');
  
  try {
    const result = execSync(cmd, { encoding: 'utf-8' });
    console.log(`✅ Created: ${issue.title}`);
    console.log(`   URL: ${result.trim()}`);
    return result.trim();
  } catch (error) {
    console.error(`❌ Failed to create: ${issue.title}`);
    console.error(`   Error: ${error.message}`);
    return null;
  }
}

/**
 * Parse input file and convert to GitHub issues
 */
function parseInputFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (ext === '.json') {
    return JSON.parse(content);
  } else if (ext === '.md') {
    return parseMarkdownToIssues(content);
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }
}

/**
 * Parse markdown format to issues
 * Expected format:
 * ## [Agent] Title
 * Description
 * - label1, label2
 * Priority: High
 */
function parseMarkdownToIssues(markdown) {
  const issues = [];
  const sections = markdown.split(/^##\s+/m).filter(Boolean);
  
  for (const section of sections) {
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    
    // Parse title (first line)
    const titleLine = lines[0];
    const agentMatch = titleLine.match(/^\[(\w+)\]\s+(.+)$/);
    const agent = agentMatch ? agentMatch[1].toLowerCase() : null;
    const title = agentMatch ? agentMatch[2] : titleLine;
    
    // Parse body and metadata
    let body = '';
    let labels = [];
    let priority = 'medium';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('- ')) {
        // Labels
        const labelList = line.substring(2).split(',').map(l => l.trim());
        labels.push(...labelList);
      } else if (line.startsWith('Priority:')) {
        priority = line.substring(9).trim().toLowerCase();
      } else {
        // Part of body
        body += line + '\n';
      }
    }
    
    // Add agent labels
    if (agent && AGENT_LABELS[agent]) {
      labels.push(...AGENT_LABELS[agent]);
    }
    
    // Add priority labels
    if (PRIORITY_LABELS[priority]) {
      labels.push(...PRIORITY_LABELS[priority]);
    }
    
    // Deduplicate labels
    labels = [...new Set(labels)];
    
    issues.push({
      title: `[${agent?.toUpperCase() || 'TASK'}] ${title}`,
      body: body.trim() || 'No description provided.',
      labels,
      assignees: [],
      milestone: null
    });
  }
  
  return issues;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node bulk-import-issues.js <input-file>');
    console.error('');
    console.error('Input file can be:');
    console.error('  - JSON: Array of issue objects');
    console.error('  - Markdown: Formatted task list');
    console.error('');
    console.error('JSON format:');
    console.error(JSON.stringify([{
      title: '[CHUCK] Add deployment health checks',
      body: 'Description here',
      labels: ['agent:chuck', 'ci-cd', 'priority:high'],
      assignees: [],
      milestone: null
    }], null, 2));
    process.exit(1);
  }
  
  const inputFile = args[0];
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }
  
  console.log(`📦 Importing issues from: ${inputFile}`);
  console.log('');
  
  try {
    const issues = parseInputFile(inputFile);
    console.log(`Found ${issues.length} issues to import`);
    console.log('');
    
    // Confirm before proceeding
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Proceed with import? (yes/no): ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('Import cancelled.');
        process.exit(0);
      }
      
      console.log('');
      console.log('Importing issues...');
      console.log('');
      
      let successCount = 0;
      let failCount = 0;
      
      for (const issue of issues) {
        const url = createGitHubIssue(issue);
        if (url) {
          successCount++;
        } else {
          failCount++;
        }
        
        // Rate limiting: wait 1 second between issues
        execSync('sleep 1');
      }
      
      console.log('');
      console.log('Import complete!');
      console.log(`✅ Success: ${successCount}`);
      console.log(`❌ Failed: ${failCount}`);
    });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseInputFile, createGitHubIssue };
