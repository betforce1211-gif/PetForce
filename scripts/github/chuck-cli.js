#!/usr/bin/env node
/**
 * Chuck CLI - GitHub Issue Management
 * CLI tool for creating and managing issues from terminal
 * Usage: chuck issue create|list|update|close
 */

const { execSync } = require('child_process');
const readline = require('readline');

const AGENT_LIST = [
  'peter', 'engrid', 'tucker', 'larry', 'dexter', 'samantha',
  'chuck', 'maya', 'axel', 'buck', 'ana', 'isabel', 'thomas', 'casey'
];

const PRIORITY_LIST = ['critical', 'high', 'medium', 'low'];

const TYPE_LIST = ['bug', 'feature', 'docs', 'refactor', 'test', 'chore'];

/**
 * Prompt user for input
 */
function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Select from list
 */
async function select(question, options) {
  console.log(question);
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
  
  const answer = await prompt('Select (number): ');
  const index = parseInt(answer) - 1;
  
  if (index >= 0 && index < options.length) {
    return options[index];
  }
  
  return null;
}

/**
 * Create new issue interactively
 */
async function createIssue() {
  console.log('🎫 Create New GitHub Issue');
  console.log('');
  
  // Get issue type
  const type = await select('What type of issue?', TYPE_LIST);
  if (!type) {
    console.error('Invalid type selected');
    return;
  }
  
  // Get agent
  const agent = await select('Which agent is responsible?', AGENT_LIST);
  if (!agent) {
    console.error('Invalid agent selected');
    return;
  }
  
  // Get priority
  const priority = await select('What is the priority?', PRIORITY_LIST);
  if (!priority) {
    console.error('Invalid priority selected');
    return;
  }
  
  // Get title
  const title = await prompt('Issue title: ');
  if (!title) {
    console.error('Title is required');
    return;
  }
  
  // Get description
  console.log('Issue description (press Ctrl+D when done):');
  const description = await new Promise((resolve) => {
    let desc = '';
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.on('line', (line) => {
      desc += line + '\n';
    });
    
    rl.on('close', () => {
      resolve(desc.trim());
    });
  });
  
  // Build labels
  const labels = [
    `agent:${agent}`,
    `priority:${priority}`,
    `type:${type}`
  ];
  
  // Build issue body
  const body = `## Description\n\n${description}\n\n` +
    `## Agent Accountability\n\n` +
    `- Responsible: @${agent}\n` +
    `- Priority: ${priority}\n` +
    `- Type: ${type}\n\n` +
    `## Status\n\n` +
    `- [ ] Requirements defined\n` +
    `- [ ] Implementation complete\n` +
    `- [ ] Tests passing\n` +
    `- [ ] Deployed\n`;
  
  // Preview
  console.log('');
  console.log('Preview:');
  console.log('='.repeat(50));
  console.log(`Title: [${agent.toUpperCase()}] ${title}`);
  console.log(`Labels: ${labels.join(', ')}`);
  console.log('');
  console.log(body);
  console.log('='.repeat(50));
  console.log('');
  
  const confirm = await prompt('Create this issue? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    return;
  }
  
  // Create issue
  try {
    const cmd = `gh issue create --title "[${agent.toUpperCase()}] ${title}" --body "${body.replace(/"/g, '\\"')}" --label "${labels.join(',')}"`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    console.log('');
    console.log('✅ Issue created:');
    console.log(result.trim());
  } catch (error) {
    console.error('❌ Failed to create issue:', error.message);
  }
}

/**
 * List issues
 */
async function listIssues() {
  const filterAgent = await prompt('Filter by agent (or press Enter for all): ');
  const filterPriority = await prompt('Filter by priority (or press Enter for all): ');
  
  let cmd = 'gh issue list --state open';
  
  const labels = [];
  if (filterAgent) labels.push(`agent:${filterAgent}`);
  if (filterPriority) labels.push(`priority:${filterPriority}`);
  
  if (labels.length > 0) {
    cmd += ` --label "${labels.join(',')}"`;
  }
  
  try {
    const result = execSync(cmd, { encoding: 'utf-8' });
    console.log('');
    console.log(result);
  } catch (error) {
    console.error('❌ Failed to list issues:', error.message);
  }
}

/**
 * Update issue
 */
async function updateIssue() {
  const issueNumber = await prompt('Issue number: ');
  
  if (!issueNumber || isNaN(issueNumber)) {
    console.error('Invalid issue number');
    return;
  }
  
  console.log('');
  console.log('What would you like to update?');
  console.log('  1. Add comment');
  console.log('  2. Change priority');
  console.log('  3. Add labels');
  console.log('  4. Assign to agent');
  
  const choice = await prompt('Select (1-4): ');
  
  switch (choice) {
    case '1': {
      console.log('Comment (press Ctrl+D when done):');
      const comment = await new Promise((resolve) => {
        let text = '';
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.on('line', (line) => {
          text += line + '\n';
        });
        
        rl.on('close', () => {
          resolve(text.trim());
        });
      });
      
      try {
        execSync(`gh issue comment ${issueNumber} --body "${comment.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
        console.log('✅ Comment added');
      } catch (error) {
        console.error('❌ Failed:', error.message);
      }
      break;
    }
    
    case '2': {
      const priority = await select('New priority:', PRIORITY_LIST);
      if (priority) {
        try {
          execSync(`gh issue edit ${issueNumber} --add-label "priority:${priority}"`, { encoding: 'utf-8' });
          console.log('✅ Priority updated');
        } catch (error) {
          console.error('❌ Failed:', error.message);
        }
      }
      break;
    }
    
    case '3': {
      const labels = await prompt('Labels (comma-separated): ');
      if (labels) {
        try {
          execSync(`gh issue edit ${issueNumber} --add-label "${labels}"`, { encoding: 'utf-8' });
          console.log('✅ Labels added');
        } catch (error) {
          console.error('❌ Failed:', error.message);
        }
      }
      break;
    }
    
    case '4': {
      const agent = await select('Assign to agent:', AGENT_LIST);
      if (agent) {
        try {
          execSync(`gh issue edit ${issueNumber} --add-label "agent:${agent}"`, { encoding: 'utf-8' });
          console.log(`✅ Assigned to ${agent}`);
        } catch (error) {
          console.error('❌ Failed:', error.message);
        }
      }
      break;
    }
    
    default:
      console.error('Invalid choice');
  }
}

/**
 * Close issue
 */
async function closeIssue() {
  const issueNumber = await prompt('Issue number: ');
  
  if (!issueNumber || isNaN(issueNumber)) {
    console.error('Invalid issue number');
    return;
  }
  
  const reason = await prompt('Reason (completed/not-planned): ');
  
  try {
    const cmd = `gh issue close ${issueNumber} ${reason === 'not-planned' ? '--reason "not planned"' : ''}`;
    execSync(cmd, { encoding: 'utf-8' });
    console.log('✅ Issue closed');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🛡️  Chuck CLI - GitHub Issue Management');
  console.log('');
  
  switch (command) {
    case 'create':
      await createIssue();
      break;
    
    case 'list':
      await listIssues();
      break;
    
    case 'update':
      await updateIssue();
      break;
    
    case 'close':
      await closeIssue();
      break;
    
    default:
      console.log('Usage: chuck <command>');
      console.log('');
      console.log('Commands:');
      console.log('  create   - Create new issue interactively');
      console.log('  list     - List open issues');
      console.log('  update   - Update an existing issue');
      console.log('  close    - Close an issue');
      console.log('');
      console.log('Examples:');
      console.log('  chuck create');
      console.log('  chuck list');
      console.log('  chuck update');
      console.log('  chuck close');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
