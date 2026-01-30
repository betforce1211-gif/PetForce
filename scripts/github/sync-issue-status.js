#!/usr/bin/env node
/**
 * Sync Issue Status
 * Syncs issue status between GitHub and external systems
 * Usage: node sync-issue-status.js [--dry-run]
 */

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Get all open issues with specific labels
 */
function getIssues(labels = '') {
  const cmd = `gh issue list --state open --json number,title,labels,state,assignees --limit 1000 ${labels ? `--label "${labels}"` : ''}`;
  
  try {
    const result = execSync(cmd, { encoding: 'utf-8' });
    return JSON.parse(result);
  } catch (error) {
    console.error('Failed to fetch issues:', error.message);
    return [];
  }
}

/**
 * Update issue status
 */
function updateIssue(issueNumber, options) {
  const { labels, state, comment } = options;
  
  try {
    // Add labels
    if (labels && labels.length > 0) {
      const cmd = `gh issue edit ${issueNumber} --add-label "${labels.join(',')}"`;
      execSync(cmd, { encoding: 'utf-8' });
    }
    
    // Close/reopen issue
    if (state) {
      const cmd = `gh issue ${state} ${issueNumber}`;
      execSync(cmd, { encoding: 'utf-8' });
    }
    
    // Add comment
    if (comment) {
      const cmd = `gh issue comment ${issueNumber} --body "${comment}"`;
      execSync(cmd, { encoding: 'utf-8' });
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to update issue #${issueNumber}:`, error.message);
    return false;
  }
}

/**
 * Check for stale issues
 */
function checkStaleIssues(daysThreshold = 30) {
  console.log(`Checking for issues stale for ${daysThreshold}+ days...`);
  
  const cmd = `gh issue list --state open --json number,title,updatedAt --limit 1000`;
  const issues = JSON.parse(execSync(cmd, { encoding: 'utf-8' }));
  
  const now = new Date();
  const staleIssues = [];
  
  for (const issue of issues) {
    const updatedAt = new Date(issue.updatedAt);
    const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate >= daysThreshold) {
      staleIssues.push({
        ...issue,
        daysSinceUpdate: Math.floor(daysSinceUpdate)
      });
    }
  }
  
  return staleIssues;
}

/**
 * Mark stale issues
 */
function markStaleIssues(dryRun = false) {
  const staleIssues = checkStaleIssues(30);
  
  console.log(`Found ${staleIssues.length} stale issues`);
  console.log('');
  
  if (staleIssues.length === 0) {
    console.log('✅ No stale issues found');
    return;
  }
  
  for (const issue of staleIssues) {
    console.log(`#${issue.number}: ${issue.title} (${issue.daysSinceUpdate} days)`);
    
    if (!dryRun) {
      updateIssue(issue.number, {
        labels: ['stale'],
        comment: `⚠️ This issue has been inactive for ${issue.daysSinceUpdate} days.\n\nPlease provide an update or close if no longer relevant.\n\nThis issue will be auto-closed in 7 days if no activity.`
      });
    }
  }
  
  if (dryRun) {
    console.log('');
    console.log('(Dry run - no changes made)');
  }
}

/**
 * Auto-close very stale issues
 */
function closeVeryStaleIssues(dryRun = false) {
  const veryStaleIssues = checkStaleIssues(37); // 30 + 7 grace period
  
  console.log(`Found ${veryStaleIssues.length} very stale issues to close`);
  console.log('');
  
  if (veryStaleIssues.length === 0) {
    console.log('✅ No very stale issues found');
    return;
  }
  
  for (const issue of veryStaleIssues) {
    // Check if already marked stale
    const cmd = `gh issue view ${issue.number} --json labels`;
    const result = JSON.parse(execSync(cmd, { encoding: 'utf-8' }));
    const hasStaleLabel = result.labels.some(l => l.name === 'stale');
    
    if (!hasStaleLabel) continue;
    
    console.log(`Closing #${issue.number}: ${issue.title}`);
    
    if (!dryRun) {
      updateIssue(issue.number, {
        state: 'close',
        comment: `🔒 Auto-closing due to inactivity (${issue.daysSinceUpdate} days).\n\nPlease reopen if still relevant.`
      });
    }
  }
  
  if (dryRun) {
    console.log('');
    console.log('(Dry run - no changes made)');
  }
}

/**
 * Generate status report
 */
function generateReport() {
  console.log('📊 Issue Status Report');
  console.log('='.repeat(50));
  console.log('');
  
  // Get all issues
  const allIssues = getIssues();
  
  // Count by agent
  const agentCounts = {};
  const priorityCounts = {};
  const componentCounts = {};
  
  for (const issue of allIssues) {
    // Count by agent
    const agentLabels = issue.labels.filter(l => l.name.startsWith('agent:'));
    for (const label of agentLabels) {
      agentCounts[label.name] = (agentCounts[label.name] || 0) + 1;
    }
    
    // Count by priority
    const priorityLabels = issue.labels.filter(l => l.name.startsWith('priority:'));
    for (const label of priorityLabels) {
      priorityCounts[label.name] = (priorityCounts[label.name] || 0) + 1;
    }
    
    // Count by component
    const componentLabels = issue.labels.filter(l => l.name.startsWith('component:'));
    for (const label of componentLabels) {
      componentCounts[label.name] = (componentCounts[label.name] || 0) + 1;
    }
  }
  
  console.log(`Total Open Issues: ${allIssues.length}`);
  console.log('');
  
  console.log('By Agent:');
  for (const [agent, count] of Object.entries(agentCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${agent.padEnd(20)}: ${count}`);
  }
  console.log('');
  
  console.log('By Priority:');
  for (const [priority, count] of Object.entries(priorityCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${priority.padEnd(20)}: ${count}`);
  }
  console.log('');
  
  console.log('By Component:');
  for (const [component, count] of Object.entries(componentCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${component.padEnd(20)}: ${count}`);
  }
  console.log('');
  
  // Check for issues needing attention
  const criticalIssues = getIssues('priority:critical');
  const highPriorityIssues = getIssues('priority:high');
  const staleIssues = checkStaleIssues(30);
  
  console.log('⚠️  Issues Needing Attention:');
  console.log(`  Critical: ${criticalIssues.length}`);
  console.log(`  High Priority: ${highPriorityIssues.length}`);
  console.log(`  Stale (30+ days): ${staleIssues.length}`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const command = args.find(a => !a.startsWith('--')) || 'report';
  
  console.log('🔄 Issue Status Sync');
  console.log('');
  
  switch (command) {
    case 'stale':
      markStaleIssues(dryRun);
      break;
    
    case 'close-stale':
      closeVeryStaleIssues(dryRun);
      break;
    
    case 'report':
      generateReport();
      break;
    
    default:
      console.error(`Unknown command: ${command}`);
      console.error('');
      console.error('Available commands:');
      console.error('  report       - Generate issue status report (default)');
      console.error('  stale        - Mark stale issues');
      console.error('  close-stale  - Close very stale issues');
      console.error('');
      console.error('Options:');
      console.error('  --dry-run    - Preview changes without applying');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getIssues, updateIssue, checkStaleIssues, generateReport };
