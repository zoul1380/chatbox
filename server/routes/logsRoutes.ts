import express, { Request, Response } from 'express';
import { getApiErrorLogs } from '../utils/logger';
import { LogOptions } from '../types';

const router = express.Router();

/**
 * @route GET /logs
 * @description Get error logs with optional filtering by date range
 * @access Restricted - Consider adding authentication for production
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      startDate, 
      endDate, 
      limit = '100', 
      offset = '0' 
    } = req.query as {
      startDate?: string;
      endDate?: string;
      limit?: string;
      offset?: string;
    };
    
    // Parse and validate query parameters
    const options: LogOptions = {
      limit: parseInt(limit) > 0 ? parseInt(limit) : 100,
      offset: parseInt(offset) >= 0 ? parseInt(offset) : 0
    };
    
    // Add date filtering if provided
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        options.startDate = parsedStartDate.toISOString();
      } else {
        res.status(400).json({ 
          error: true,
          message: 'Invalid startDate format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)' 
        });
        return;
      }
    }
    
    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        options.endDate = parsedEndDate.toISOString();
      } else {
        res.status(400).json({ 
          error: true,
          message: 'Invalid endDate format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)' 
        });
        return;
      }
    }
    
    // Get the logs
    const logs = await getApiErrorLogs(options);
    
    // Send JSON response
    res.json({
      total: logs.length,
      offset: options.offset,
      limit: options.limit,
      logs
    });
    
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Error retrieving logs',
      details: (error as Error).message
    });
  }
});

/**
 * @route GET /logs/html
 * @description Render logs in a simple HTML view
 * @access Restricted - Consider adding authentication for production
 */
router.get('/html', (_req: Request, res: Response): void => {
  // Simple HTML page to view logs
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Error Logs</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background: #f9f9f9; }
        h1 { color: #333; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; }
        .controls { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .control-group { display: flex; flex-direction: column; gap: 5px; }
        label { font-weight: bold; }
        input[type="date"], button, select { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #4a90e2; color: white; cursor: pointer; border: none; }
        button:hover { background: #3a80d2; }
        #logs { margin-top: 20px; }
        .log { background: white; padding: 15px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .log-header { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eaeaea; padding-bottom: 5px; }
        .timestamp { font-size: 0.9em; color: #666; }
        .message { font-weight: bold; color: #d32f2f; }
        .details { font-family: monospace; white-space: pre-wrap; background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .no-logs { text-align: center; padding: 20px; background: white; border-radius: 8px; }
        @media (max-width: 768px) {
          .controls { flex-direction: column; }
        }
      </style>
    </head>
    <body>
      <h1>API Error Logs</h1>
      <div class="controls">
        <div class="control-group">
          <label for="startDate">Start Date:</label>
          <input type="date" id="startDate">
        </div>
        <div class="control-group">
          <label for="endDate">End Date:</label>
          <input type="date" id="endDate">
        </div>
        <div class="control-group">
          <label for="limit">Limit:</label>
          <select id="limit">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100" selected>100</option>
            <option value="200">200</option>
          </select>
        </div>
        <div class="control-group">
          <label>&nbsp;</label>
          <button id="refresh">Refresh Logs</button>
        </div>
      </div>
      <div id="logs">
        <div class="no-logs">Loading logs...</div>
      </div>
      
      <script>
        // Function to fetch and display logs
        async function fetchLogs() {
          const startDate = document.getElementById('startDate').value;
          const endDate = document.getElementById('endDate').value;
          const limit = document.getElementById('limit').value;
          
          let url = '/logs?limit=' + limit;
          if (startDate) url += '&startDate=' + startDate;
          if (endDate) url += '&endDate=' + endDate;
          
          try {
            const response = await fetch(url);
            const data = await response.json();
            
            const logsDiv = document.getElementById('logs');
            
            if (!data.logs || data.logs.length === 0) {
              logsDiv.innerHTML = '<div class="no-logs">No logs found for the selected criteria</div>';
              return;
            }
            
            logsDiv.innerHTML = '';
            
            data.logs.forEach(log => {
              const date = new Date(log.timestamp);
              const formattedDate = date.toLocaleString();
              
              let logHtml = \`
                <div class="log">
                  <div class="log-header">
                    <div class="message">\${log.message}</div>
                    <div class="timestamp">\${formattedDate}</div>
                  </div>
              \`;
              
              if (log.request) {
                logHtml += \`
                  <div>
                    <strong>Request:</strong> \${log.request.method} \${log.request.path}
                  </div>
                \`;
              }
              
              if (log.stack) {
                logHtml += \`
                  <details>
                    <summary>Stack Trace</summary>
                    <div class="details">\${log.stack}</div>
                  </details>
                \`;
              }
              
              logHtml += '</div>';
              logsDiv.innerHTML += logHtml;
            });
            
          } catch (error) {
            console.error('Error fetching logs:', error);
            document.getElementById('logs').innerHTML = \`
              <div class="no-logs">
                Error fetching logs: \${error.message}
              </div>
            \`;
          }
        }
        
        // Set up event listeners
        document.addEventListener('DOMContentLoaded', () => {
          // Set default dates
          const now = new Date();
          const startOfDay = new Date(now);
          startOfDay.setHours(0, 0, 0, 0);
          
          document.getElementById('startDate').valueAsDate = new Date(now.setDate(now.getDate() - 7));
          document.getElementById('endDate').valueAsDate = new Date();
          
          // Initial load
          fetchLogs();
          
          // Refresh button
          document.getElementById('refresh').addEventListener('click', fetchLogs);
        });
        
        // Auto-refresh every 30 seconds
        setInterval(fetchLogs, 30000);
      </script>
    </body>
    </html>
  `);
});

// Export the router correctly
export default router;
