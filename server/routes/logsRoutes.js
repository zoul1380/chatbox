const express = require('express');
const router = express.Router();
const { getApiErrorLogs } = require('../utils/logger');

/**
 * @route GET /logs
 * @description Get error logs with optional filtering by date range
 * @access Restricted - Consider adding authentication for production
 */
router.get('/', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      limit = 100, 
      offset = 0 
    } = req.query;
    
    // Parse and validate query parameters
    const options = {
      limit: parseInt(limit) > 0 ? parseInt(limit) : 100,
      offset: parseInt(offset) >= 0 ? parseInt(offset) : 0
    };
    
    // Add date filtering if provided
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        options.startDate = parsedStartDate.toISOString();
      } else {
        return res.status(400).json({ 
          error: true,
          message: 'Invalid startDate format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)' 
        });
      }
    }
    
    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        options.endDate = parsedEndDate.toISOString();
      } else {
        return res.status(400).json({ 
          error: true,
          message: 'Invalid endDate format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)' 
        });
      }
    }
    
    // Get the logs
    const logs = await getApiErrorLogs(options);
    
    // Return JSON response
    return res.status(200).json({
      total: logs.length,
      limit: options.limit,
      offset: options.offset,
      logs
    });
  } catch (err) {
    console.error('Error fetching logs:', err);
    return res.status(500).json({
      error: true, 
      message: 'Failed to fetch logs'
    });
  }
});

/**
 * @route GET /logs/html
 * @description Get error logs in HTML format for browser display
 * @access Restricted - Consider adding authentication for production
 */
router.get('/html', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      limit = 100, 
      offset = 0 
    } = req.query;
    
    // Parse and validate query parameters
    const options = {
      limit: parseInt(limit) > 0 ? parseInt(limit) : 100,
      offset: parseInt(offset) >= 0 ? parseInt(offset) : 0
    };
    
    // Add date filtering if provided
    if (startDate) {
      options.startDate = new Date(startDate).toISOString();
    }
    
    if (endDate) {
      options.endDate = new Date(endDate).toISOString();
    }
    
    // Get the logs
    const logs = await getApiErrorLogs(options);
    
    // Generate HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ChatBox Server Logs</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #2c3e50;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
          }
          .filters {
            background: #f7f9fc;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .log-container {
            margin-top: 20px;
          }
          .log-entry {
            margin-bottom: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .log-entry pre {
            white-space: pre-wrap;
            background: #f5f5f5;
            padding: 10px;
            border-radius: 3px;
            overflow: auto;
          }
          .error-message {
            color: #e74c3c;
            font-weight: bold;
          }
          .timestamp {
            color: #7f8c8d;
            font-size: 0.9em;
          }
          .pagination {
            margin-top: 20px;
            text-align: center;
          }
          button, input[type="date"], input[type="number"] {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          button {
            background: #3498db;
            color: white;
            cursor: pointer;
            margin: 0 5px;
          }
          button:hover {
            background: #2980b9;
          }
          label {
            margin-right: 10px;
          }
          #refreshBtn {
            background: #2ecc71;
          }
          #refreshBtn:hover {
            background: #27ae60;
          }
          .stack-trace {
            font-family: monospace;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <h1>ChatBox Server Error Logs</h1>
        <div class="filters">
          <form id="logFilterForm">
            <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
              <div>
                <label for="startDate">Start Date:</label>
                <input type="date" id="startDate" name="startDate" value="${startDate ? startDate.split('T')[0] : ''}">
              </div>
              <div>
                <label for="endDate">End Date:</label>
                <input type="date" id="endDate" name="endDate" value="${endDate ? endDate.split('T')[0] : ''}">
              </div>
              <div>
                <label for="limit">Limit:</label>
                <input type="number" id="limit" name="limit" min="1" max="500" value="${limit}">
              </div>
              <div>
                <button type="submit">Apply Filters</button>
                <button type="button" id="refreshBtn">Refresh</button>
              </div>
            </div>
          </form>
        </div>
        
        <div class="log-container">
          ${logs.length > 0 ? logs.map(log => `
            <div class="log-entry">
              <div class="timestamp">${new Date(log.timestamp).toLocaleString()}</div>
              <div class="error-message">${log.message || 'No error message'}</div>
              
              <h3>Request Details</h3>
              <div>
                <strong>Method:</strong> ${log.request?.method || 'N/A'}
                <strong>Path:</strong> ${log.request?.path || 'N/A'}
              </div>
              
              <h3>Stack Trace</h3>
              <pre class="stack-trace">${log.stack || 'No stack trace available'}</pre>
              
              <details>
                <summary>Additional Details</summary>
                <pre>${JSON.stringify(log, null, 2)}</pre>
              </details>
            </div>
          `).join('') : '<p>No logs found for the selected period.</p>'}
        </div>
        
        <div class="pagination">
          ${offset > 0 ? `<button id="prevBtn" data-offset="${Math.max(0, offset - limit)}">Previous Page</button>` : ''}
          <button id="nextBtn" data-offset="${parseInt(offset) + parseInt(limit)}">Next Page</button>
        </div>
        
        <script>
          document.getElementById('refreshBtn').addEventListener('click', function() {
            window.location.reload();
          });
          
          document.getElementById('logFilterForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const limit = document.getElementById('limit').value;
            
            let url = '/logs/html?';
            if(startDate) url += 'startDate=' + startDate + '&';
            if(endDate) url += 'endDate=' + endDate + '&';
            if(limit) url += 'limit=' + limit + '&';
            
            window.location.href = url;
          });
          
          // Pagination event listeners
          if(document.getElementById('prevBtn')) {
            document.getElementById('prevBtn').addEventListener('click', function() {
              const newOffset = this.getAttribute('data-offset');
              
              let url = new URL(window.location.href);
              url.searchParams.set('offset', newOffset);
              window.location.href = url.toString();
            });
          }
          
          if(document.getElementById('nextBtn')) {
            document.getElementById('nextBtn').addEventListener('click', function() {
              const newOffset = this.getAttribute('data-offset');
              
              let url = new URL(window.location.href);
              url.searchParams.set('offset', newOffset);
              window.location.href = url.toString();
            });
          }
          
          // Auto-refresh every 30 seconds
          setTimeout(function() {
            window.location.reload();
          }, 30000);
        </script>
      </body>
      </html>
    `;
    
    // Send HTML response
    res.set('Content-Type', 'text/html');
    return res.send(htmlContent);
  } catch (err) {
    console.error('Error generating HTML logs page:', err);
    return res.status(500).send('<h1>Error generating logs page</h1><p>Please try again later.</p>');
  }
});

module.exports = router;
