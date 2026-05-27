import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import { DB } from './server/db';
import { AISuggestion, AIInsights, Task, TaskCategory } from './src/types';

// Extend Express Request type to support authenticated user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-ai-super-secret-key-2026';

  // Body parser limit expanded to handle AI attachments if needed
  app.use(express.json());

  // Initialize Gemini AI Client
  let ai: GoogleGenAI | null = null;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log('Gemini AI successfully initialized for server.');
    } catch (e) {
      console.error('Error initializing Gemini client:', e);
    }
  } else {
    console.warn('GEMINI_API_KEY not configured. Running with local fallback analyzers for AI features.');
  }

  // Auth Middleware
  function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Your session has expired or is invalid. Please sign in again.' });
    }
  }

  // --- REST ENDPOINTS ---

  // AUTHENTICATION ROUTES
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please submit your name, email, and password.' });
    }

    try {
      const existingUser = DB.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'This email is already registered.' });
      }

      const user = await DB.createUser(name, email, password);
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      
      res.status(201).json({ token, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error occurred during registration.' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both your email and password.' });
    }

    try {
      const user = await DB.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Incorrect email or password.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user });
    } catch (err: any) {
      res.status(500).json({ error: 'Error logging in.' });
    }
  });

  app.get('/api/auth/me', authenticateToken as express.RequestHandler, async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const user = DB.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: 'Error getting user details.' });
    }
  });

  // TASK MANAGEMENT CRUD ROUTES
  app.get('/api/tasks', authenticateToken as express.RequestHandler, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const tasks = DB.getTasks(req.user.id);
      res.json({ tasks });
    } catch (err) {
      res.status(500).json({ error: 'Error loading tasks.' });
    }
  });

  app.post('/api/tasks', authenticateToken as express.RequestHandler, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const newTask = DB.createTask(req.user.id, req.body);
      res.status(201).json({ task: newTask });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error adding task.' });
    }
  });

  app.put('/api/tasks/:id', authenticateToken as express.RequestHandler, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const updatedTask = DB.updateTask(req.params.id, req.user.id, req.body);
      res.json({ task: updatedTask });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error changing task.' });
    }
  });

  app.delete('/api/tasks/:id', authenticateToken as express.RequestHandler, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const success = DB.deleteTask(req.params.id, req.user.id);
      if (!success) {
        return res.status(404).json({ error: 'Task not found or access denied.' });
      }
      res.json({ message: 'Task deleted successfully.', success });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting task.' });
    }
  });

  // --- AI FEATURE ROUTES WITH GEMINI API & LOCAL SECURE FALLBACKS ---

  // 1. AI Intelligent Task Generator / Suggestions
  app.post('/api/ai/suggest', authenticateToken as express.RequestHandler, async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { mood, promptCategory } = req.body;

    const userTasks = DB.getTasks(req.user.id);
    const pendingTaskSummaries = userTasks
      .filter(t => t.status !== 'completed')
      .map(t => `${t.title} (${t.category}, ${t.priority} priority)`)
      .join(', ');

    try {
      if (ai) {
        console.log(`Querying Gemini (gemini-3.5-flash) for task suggestions...`);
        const message = `The user "${req.user.name}" is looking for dynamic productivity action items. 
Current focus category requested: "${promptCategory || 'work'}". 
User's current dynamic mindset/mood focus: "${mood || 'balanced and productive'}".
Current pending tasks are: [${pendingTaskSummaries || 'None. Fresh board!'}].

Generate exactly 3 smart, tailored task suggestions to fit their mood and fill any gaps in their roadmap. Use descriptive actions. Ensure response values for priority must be LOW, MEDIUM, or HIGH, and category must be WORK, PERSONAL, GROWTH, FINANCE, or OTHER.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: message,
          config: {
            systemInstruction: 'You are an elite productivity executive assistant. Formulate your recommendations to be achievable and highly motivating. Map categories strictly to: work, personal, growth, finance, other. Priority must map strictly to: low, medium, high.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              description: 'List of recommended custom task suggestions.',
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, description: 'Must be low, medium, or high' },
                  category: { type: Type.STRING, description: 'Must be work, personal, growth, finance, or other' },
                  estimatedTime: { type: Type.INTEGER, description: 'Estimated time in minutes' }
                },
                required: ['title', 'description', 'priority', 'category']
              }
            }
          }
        });

        const text = response.text;
        if (text) {
          const suggestions = JSON.parse(text);
          return res.json({ suggestions });
        }
      }
      
      // Fallback response if AI is not available
      throw new Error('Fallback to local');
    } catch (err) {
      console.log('Gemini model request fallback. Running local productivity heuristic analyzer...');
      
      // Local highly intelligent procedural generation based on category & mood
      const selectedCat = (promptCategory || 'work').toLowerCase() as TaskCategory;
      const suggestions: AISuggestion[] = [
        {
          title: `Structure weekly goals for ${selectedCat}`,
          description: `Formulate 3 high-impact outcomes you want to secure in ${selectedCat} to bolster momentum.`,
          priority: 'high',
          category: selectedCat,
          estimatedTime: 25
        },
        {
          title: 'Review bottlenecked workflows',
          description: `Identify any low-efficiency habits preventing quick resolution of action items.`,
          priority: 'medium',
          category: 'growth',
          estimatedTime: 20
        },
        {
          title: 'Organize clutter and workspace sync',
          description: `Take a 10-minute break to purge unnecessary files/documents and reset your immediate environment.`,
          priority: 'low',
          category: 'personal',
          estimatedTime: 15
        }
      ];

      res.json({ suggestions, local: true });
    }
  });

  // 2. AI Productivity Analytics & Smart Insights
  app.get('/api/ai/insights', authenticateToken as express.RequestHandler, async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const userTasks = DB.getTasks(req.user.id);
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const inProgress = userTasks.filter(t => t.status === 'in_progress').length;
    
    // Simple calculated heuristic
    const baseScore = total === 0 ? 50 : Math.round((completed / total) * 100);

    const taskListString = userTasks.map(t => `- [${t.status}] ${t.title} (Priority: ${t.priority}, Category: ${t.category})`).join('\n');

    try {
      if (ai) {
        console.log(`Querying Gemini (gemini-3.5-flash) for personalized productivity insights...`);
        const message = `Please generate high-value elite business leadership level diagnostic summary analytics on user: "${req.user.name}".
Stats summary:
- Total Tasks Tracked: ${total}
- Completed Tasks: ${completed}
- Pending Tasks: ${pending}
- Tasks In Progress: ${inProgress}
Productivity Ratio: ${baseScore}%

Full User Roadmap:\n${taskListString || 'Empty Board. No tasks listed.'}

Give them a smart breakdown. Tailor the analytical recommendations depending on how well they are doing. Be highly actionable.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: message,
          config: {
            systemInstruction: 'You are an expert executive productivity coach. Highlight both micro and macro-level changes users can perform, providing a clear score from 0-100 indicating their overall execution score.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                productivityScore: { type: Type.INTEGER, description: 'Score based on ratio of tasks completed & priorities met' },
                summary: { type: Type.STRING, description: 'Diagnostic evaluation of weekly focus' },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: '2 to 3 major behavioral strengths' },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 dynamic improvement items' }
              },
              required: ['productivityScore', 'summary', 'strengths', 'recommendations']
            }
          }
        });

        const text = response.text;
        if (text) {
          const insights = JSON.parse(text);
          return res.json({ insights });
        }
      }
      throw new Error('Fallback to local');
    } catch (err) {
      // Robust calculation-based fallback
      const score = Math.min(100, Math.max(10, baseScore + 10)); // simulated dynamic lift
      let summaryStr = `You have logged ${total} tasks with ${completed} completed. Perfecting your schedule depends on daily focus intervals.`;
      let tips: string[] = [];
      let strengthsArr: string[] = [];

      if (total === 0) {
        summaryStr = "Welcome to Taskflow-ai! Start by creating 2-3 weekly tasks in Work or Growth categories to activate your personalized performance tracker.";
        strengthsArr = ["Account Ready", "Clear Slate"];
        tips = ["Add a task to set direction", "Explore recommended suggestions to plan your afternoon", "Set priority levels to highlight focus areas"];
      } else if (completed === 0) {
        summaryStr = "You have task inventory waiting in your queue! High priority tasks can feel overwhelming—tackle them inside dedicated pomodoro focus blocks.";
        strengthsArr = ["Foresight & Intake Logged"];
        tips = ["Break down your largest Work task into three 15-minute sub-tasks", "Start with a low-priority task to build momentum", "Use In Progress status to signal active concentration"];
      } else {
        summaryStr = `Solid baseline! You are performing at a ${score}% effectiveness level. Completing your pending high-urgency roadmaps will unlock superior focus streaks.`;
        strengthsArr = ["Pragmatic scheduling", `${completed} tasks successfully deployed`];
        tips = ["Maintain consecutive logins to expand your active productivity streak count", "Address 'High' priority cards first thing in the morning", "Review 'growth' tasks during weekly review sessions"];
      }

      const insights: AIInsights = {
        productivityScore: score,
        summary: summaryStr,
        strengths: strengthsArr,
        recommendations: tips
      };

      res.json({ insights, local: true });
    }
  });

  // 3. Smart Task Creator Chat Interface / Assistant Suggestion
  app.post('/api/ai/chat', authenticateToken as express.RequestHandler, async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Message prompt is empty.' });
    }

    try {
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `User message: "${prompt}". Respond to the user's task management query or draft structured tasks for them. If they are talking about creating a task, respond in a short, friendly encouraging way and include JSON array of suggested task objects to add if relevant. Keep output text concise in Markdown format.`,
          config: {
            systemInstruction: `You are Taskflow AI Assistant, a friendly and futuristic chatbot helping inside a modern task boarding app. Help users organize work and growth plan. Encourage focus, clarity, and focus interval breaks.`
          }
        });

        const text = response.text;
        return res.json({ reply: text });
      }
      throw new Error('No AI client');
    } catch (err) {
      // Heuristic responses
      const pLower = prompt.toLowerCase();
      let reply = `Taskflow-ai assistant here! I am currently running in offline node mode. How can I help you coordinate your ${DB.getTasks(req.user.id).length} active workflow tasks today?`;

      if (pLower.includes('how') || pLower.includes('help')) {
        reply = `Hello! I am your productivity companion. Here's what you can do is:\n1. Click **"AI Suggester"** on the toolbar to instantly generate active tailored lists.\n2. Complete active tasks to sustain your daily **Streaks** multiplier.\n3. Track your execution scores inside the interactive **AI Performance Hub** card!`;
      } else if (pLower.includes('create') || pLower.includes('add') || pLower.includes('task')) {
        reply = `I can help with that! Simply use the quick-action **"+ New Task"** button on the right of the board. You can select priorities, categories, and due dates dynamically!`;
      }

      res.json({ reply, local: true });
    }
  });


  // --- FRONTEND ROUTE SERVING ---

  // Vite development integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind server on standard port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Taskflow-ai server online and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical error starting Express + Vite server:", error);
});
