import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPasteSchema } from "@shared/schema";
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
