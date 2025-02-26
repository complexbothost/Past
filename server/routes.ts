import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPasteSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Paste routes
  app.get("/api/pastes", async (req, res) => {
    try {
      const pastes = await storage.getPublicPastes();
      res.json(pastes);
    } catch (err) {
      res.status(500).json({ message: "Error retrieving pastes" });
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
      const paste = await storage.createPaste({
        ...pasteData,
        userId: req.user!.id,
      });
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

  const httpServer = createServer(app);

  return httpServer;
}