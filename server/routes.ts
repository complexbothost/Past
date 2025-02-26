import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPasteSchema, insertCommentSchema, UserRole, updateRoleSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';

// IP restriction middleware
const checkIPRestriction = async (req: Request, res: Response, next: Function) => {
  try {
    // Get the user's IP (accounting for proxies, which is common in Replit)
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

    // Skip check for static resources
    if (req.path.startsWith('/uploads/') || req.path.startsWith('/assets/')) {
      return next();
    }

    // Always allow access to the error page that will be shown for restricted IPs
    if (req.path === '/api/restricted') {
      return next();
    }

    // Skip check for admins that are already logged in
    if (req.isAuthenticated() && req.user?.isAdmin) {
      return next();
    }

    // Check if IP is restricted
    const isRestricted = await storage.isIPRestricted(ip);
    if (isRestricted) {
      // For API requests, return JSON
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          error: 'IP_RESTRICTED',
          message: 'Your IP address has been restricted from accessing this site.'
        });
      }

      // For non-API requests, redirect to a page explaining the restriction
      return res.redirect('/restricted');
    }

    next();
  } catch (err) {
    console.error('Error checking IP restriction:', err);
    next();
  }
};

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageMulter = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storageMulter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Store active WebSocket connections
const activeConnections: Map<number, WebSocket> = new Map();

// Send notification to all connected users
const notifyAllUsers = (message: any) => {
  activeConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply IP restriction middleware to all routes
  app.use(checkIPRestriction);

  // Setup authentication routes
  setupAuth(app);

  // API endpoint to inform about IP restriction
  app.get("/api/restricted", (req, res) => {
    res.status(403).json({
      error: 'IP_RESTRICTED',
      message: 'Your IP address has been restricted from accessing this site.'
    });
  });

  // Search pastes by title
  app.get("/api/pastes/search", async (req, res) => {
    try {
      const query = req.query.q as string;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const pastes = await storage.searchPastesByTitle(query);
      res.json(pastes);
    } catch (err) {
      res.status(500).json({ message: "Error searching pastes" });
    }
  });

  // Paste routes
  app.get("/api/pastes", async (req, res) => {
    try {
      const pastes = await storage.getPublicPastes();

      // Sort pastes: pinned admin pastes first, then by creation date
      pastes.sort((a, b) => {
        // Check if paste is pinned (pinnedUntil time is in the future)
        const aIsPinned = a.isPinned && a.pinnedUntil && new Date(a.pinnedUntil) > new Date();
        const bIsPinned = b.isPinned && b.pinnedUntil && new Date(b.pinnedUntil) > new Date();

        // First sort by pinned status
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;

        // Then sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      res.json(pastes);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving pastes" });
    }
  });

  // IP Restriction Admin Routes

  // Get all restricted IPs
  app.get("/api/admin/ip-restrictions", isAdmin, async (req, res) => {
    try {
      const restrictedIPs = await storage.getAllRestrictedIPs();
      res.json(restrictedIPs);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving IP restrictions" });
    }
  });

  // Add IP restriction
  app.post("/api/admin/ip-restrictions", isAdmin, async (req, res) => {
    try {
      const { ip, reason } = req.body;

      if (!ip || !reason) {
        return res.status(400).json({ message: "IP address and reason are required" });
      }

      // Simple IP validation
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) {
        return res.status(400).json({ message: "Invalid IP address format" });
      }

      // Don't allow restricting your own IP
      const userIP = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
      if (ip === userIP) {
        return res.status(400).json({ message: "You cannot restrict your own IP address" });
      }

      await storage.addRestrictedIP(ip, reason, req.user!.id);

      res.status(201).json({ message: "IP restricted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error adding IP restriction" });
    }
  });

  // Remove IP restriction
  app.delete("/api/admin/ip-restrictions/:ip", isAdmin, async (req, res) => {
    try {
      const ip = req.params.ip;

      const success = await storage.removeRestrictedIP(ip);
      if (!success) {
        return res.status(404).json({ message: "IP restriction not found" });
      }

      res.status(200).json({ message: "IP restriction removed successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error removing IP restriction" });
    }
  });

  app.get("/api/pastes/clown", async (req, res) => {
    try {
      const pastes = await storage.getClownPastes();
      res.json(pastes);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving clown pastes" });
    }
  });

  app.get("/api/pastes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid paste ID" });
      }

      const paste = await storage.getPaste(id);
      if (!paste) {
        return res.status(404).json({ message: "Paste not found" });
      }

      // If paste is private, only the owner or admin can view it
      if (paste.isPrivate && (!req.user || (req.user.id !== paste.userId && !req.user.isAdmin))) {
        return res.status(403).json({ message: "You don't have permission to view this paste" });
      }

      res.json(paste);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving paste" });
    }
  });

  app.post("/api/pastes", isAuthenticated, async (req, res) => {
    try {
      const pasteData = insertPasteSchema.parse(req.body);

      // Handle admin paste specific fields
      let adminPasteData = {};
      if (req.user!.isAdmin) {
        // If user is admin and requested admin paste features
        if (pasteData.isAdminPaste) {
          // Set admin paste fields
          adminPasteData = {
            isAdminPaste: true,
            isPinned: pasteData.isPinned || false,
            extraDetails: pasteData.extraDetails || '',
          };

          // If paste should be pinned, set pinnedUntil to 24 hours from now
          if (pasteData.isPinned) {
            const pinnedUntil = new Date();
            pinnedUntil.setHours(pinnedUntil.getHours() + 24);
            adminPasteData = {
              ...adminPasteData,
              pinnedUntil,
            };
          }
        }
      }

      const paste = await storage.createPaste({
        ...pasteData,
        userId: req.user!.id,
        ...adminPasteData,
      });

      // Notify all users if it's an admin paste
      if (req.user!.isAdmin && pasteData.isAdminPaste) {
        notifyAllUsers({
          type: 'admin_paste',
          message: `New admin paste: ${paste.title}`,
          pasteId: paste.id,
          authorName: req.user!.username
        });
      }

      res.status(201).json(paste);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid paste data", errors: err.errors });
      }
      res.status(500).json({ message: "Error creating paste" });
    }
  });

  // New endpoint: Update paste
  app.patch("/api/pastes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid paste ID" });
      }

      const paste = await storage.getPaste(id);
      if (!paste) {
        return res.status(404).json({ message: "Paste not found" });
      }

      // Only the paste owner or admin can edit
      if (req.user!.id !== paste.userId && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to edit this paste" });
      }

      const updatedPaste = await storage.updatePaste(id, req.body);
      res.json(updatedPaste);
    } catch (err) {
      res.status(500).json({ message: "Error updating paste" });
    }
  });

  app.delete("/api/pastes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid paste ID" });
      }

      const paste = await storage.getPaste(id);
      if (!paste) {
        return res.status(404).json({ message: "Paste not found" });
      }

      // Only the paste owner or admin can delete
      if (req.user!.id !== paste.userId && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to delete this paste" });
      }

      await storage.deletePaste(id);
      res.status(200).json({ message: "Paste deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting paste" });
    }
  });

  // User-specific paste routes
  app.get("/api/user/pastes", isAuthenticated, async (req, res) => {
    try {
      const pastes = await storage.getUserPastes(req.user!.id);
      res.json(pastes);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving user pastes" });
    }
  });

  // New endpoint: Get user profile
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving user" });
    }
  });

  // New endpoint: Get user's pastes
  app.get("/api/users/:id/pastes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const pastes = await storage.getUserPastes(id);
      // Filter out private pastes unless the requester is the owner or admin
      const filteredPastes = pastes.filter(paste => {
        return !paste.isPrivate ||
                (req.user && (req.user.id === paste.userId || req.user.isAdmin));
      });

      res.json(filteredPastes);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving user pastes" });
    }
  });

  // New endpoint: Update user bio
  app.patch("/api/users/:id/bio", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Only the user or admin can update the bio
      if (req.user!.id !== id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to update this user's bio" });
      }

      const { bio } = req.body;
      if (typeof bio !== 'string') {
        return res.status(400).json({ message: "Bio must be a string" });
      }

      const user = await storage.updateUser(id, { bio });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Error updating user bio" });
    }
  });

  // New endpoint: Update user role (admin only)
  app.patch("/api/admin/users/:id/role", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Validate the role update
      const result = updateRoleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid role", errors: result.error.errors });
      }

      const user = await storage.updateUser(id, { role: result.data.role });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Error updating user role" });
    }
  });

  // New endpoint: Get user profile comments
  app.get("/api/users/:id/comments", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const comments = await storage.getProfileComments(id);
      res.json(comments);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving comments" });
    }
  });

  // New endpoint: Add comment to user profile - Removed authentication requirement
  app.post("/api/users/:id/comments", async (req, res) => {
    try {
      const profileUserId = parseInt(req.params.id);
      if (isNaN(profileUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const commentData = insertCommentSchema.parse({
        ...req.body,
        profileUserId
      });

      // If user is not logged in, set userId to 0 (anonymous)
      const userId = req.user ? req.user.id : 0;

      const comment = await storage.createComment({
        ...commentData,
        userId
      });

      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: err.errors });
      }
      res.status(500).json({ message: "Error creating comment" });
    }
  });

  // New endpoint: Delete comment
  app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      // Only allow deletion by admin (for moderation purposes)
      if (!req.user!.isAdmin) {
        return res.status(403).json({ message: "Only admins can delete comments" });
      }

      const success = await storage.deleteComment(id);
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting comment" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords back to the client
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving users" });
    }
  });

  // New endpoint: Get all users (public)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Only send public information
      const publicUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        bio: user.bio,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }));
      res.json(publicUsers);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving users" });
    }
  });


  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Don't allow deleting yourself
      if (id === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  app.patch("/api/admin/pastes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid paste ID" });
      }

      const paste = await storage.getPaste(id);
      if (!paste) {
        return res.status(404).json({ message: "Paste not found" });
      }

      const updatedPaste = await storage.updatePaste(id, req.body);
      res.json(updatedPaste);
    } catch (err) {
      res.status(500).json({ message: "Error updating paste" });
    }
  });

  // New endpoint: Upload avatar
  app.post("/api/users/:id/avatar", isAuthenticated, upload.single('avatar'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Only allow users to update their own avatar
      if (req.user!.id !== id) {
        return res.status(403).json({ message: "You don't have permission to update this user's avatar" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const avatarUrl = `/uploads/${req.file.filename}`;
      const user = await storage.updateUser(id, { avatarUrl });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Error updating avatar" });
    }
  });

  // Audit Log Routes (admin only)
  app.get("/api/admin/audit-logs", isAdmin, async (req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving audit logs" });
    }
  });

  app.get("/api/admin/audit-logs/deleted-users", isAdmin, async (req, res) => {
    try {
      const logs = await storage.getDeletedUsers();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving deleted users logs" });
    }
  });

  app.get("/api/admin/audit-logs/deleted-pastes", isAdmin, async (req, res) => {
    try {
      const logs = await storage.getDeletedPastes();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving deleted pastes logs" });
    }
  });

  app.get("/api/admin/audit-logs/edits", isAdmin, async (req, res) => {
    try {
      const logs = await storage.getEditLogs();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving edit logs" });
    }
  });

  app.get("/api/admin/audit-logs/user/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const logs = await storage.getAuditLogsByUser(userId);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving user audit logs" });
    }
  });

  app.get("/api/admin/audit-logs/action/:action", isAdmin, async (req, res) => {
    try {
      const action = req.params.action;
      const logs = await storage.getAuditLogsByAction(action);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving action audit logs" });
    }
  });

  app.use('/uploads', express.static(uploadDir));

  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Assign a temporary ID if the user is not authenticated
    let userId = 0;

    // Extract real IP address from request
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    // Set up message handler
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Authenticate the WebSocket connection if token provided
        if (data.type === 'auth' && data.userId) {
          userId = parseInt(data.userId);
          // Store the connection
          activeConnections.set(userId, ws);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });

    // Clean up on disconnect
    ws.on('close', () => {
      if (userId > 0) {
        activeConnections.delete(userId);
      }
    });

    // Send initial connection acknowledgment
    ws.send(JSON.stringify({ type: 'connection', status: 'connected', message: 'Welcome to DoxNightmare!' }));
  });

  return httpServer;
}