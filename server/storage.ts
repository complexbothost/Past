import { users, type User, type InsertUser, pastes, type Paste, type InsertPaste, comments, type Comment, type InsertComment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Corrected SessionStore type
type SessionStore = ReturnType<typeof createMemoryStore>;

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { ipAddress?: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Paste operations
  getPaste(id: number): Promise<Paste | undefined>;
  createPaste(paste: InsertPaste & { userId: number }): Promise<Paste>;
  getUserPastes(userId: number): Promise<Paste[]>;
  getPublicPastes(): Promise<Paste[]>;
  getClownPastes(): Promise<Paste[]>;
  updatePaste(id: number, data: Partial<Paste>): Promise<Paste | undefined>;
  deletePaste(id: number): Promise<boolean>;

  // Comment operations
  getProfileComments(profileUserId: number): Promise<Comment[]>;
  createComment(comment: InsertComment & { userId: number }): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;

  // Session storage
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pastes: Map<number, Paste>;
  private comments: Map<number, Comment>;
  sessionStore: SessionStore;
  userCurrentId: number;
  pasteCurrentId: number;
  commentCurrentId: number;

  constructor() {
    this.users = new Map();
    this.pastes = new Map();
    this.comments = new Map();
    this.userCurrentId = 1;
    this.pasteCurrentId = 1;
    this.commentCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Add admin user at startup
    this.createUser({
      username: "krane",
      password: "password123", // Changed from hashed password to plaintext for easier access
      ipAddress: "127.0.0.1",
      bio: "Admin of DoxNightmare. I can see everything.",
      avatarUrl: null,
      isAdmin: true,
      createdAt: new Date(),
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser & { ipAddress?: string, bio?: string, avatarUrl?: string | null, isAdmin?: boolean, createdAt?: Date }): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      ipAddress: insertUser.ipAddress || null,
      bio: insertUser.bio || "",
      avatarUrl: insertUser.avatarUrl || null,
      isAdmin: insertUser.isAdmin || false,
      role: insertUser.role || null, // Add role property with default null value
      createdAt: insertUser.createdAt || new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Paste operations
  async getPaste(id: number): Promise<Paste | undefined> {
    return this.pastes.get(id);
  }

  async createPaste(insertPaste: InsertPaste & { userId: number }): Promise<Paste> {
    const id = this.pasteCurrentId++;
    const paste: Paste = { 
      ...insertPaste, 
      id, 
      isPrivate: insertPaste.isPrivate || false,
      isClown: false,
      createdAt: new Date() 
    };
    this.pastes.set(id, paste);
    return paste;
  }

  async getUserPastes(userId: number): Promise<Paste[]> {
    return Array.from(this.pastes.values()).filter(
      (paste) => paste.userId === userId
    );
  }

  async getPublicPastes(): Promise<Paste[]> {
    return Array.from(this.pastes.values()).filter(
      (paste) => !paste.isPrivate
    );
  }

  async getClownPastes(): Promise<Paste[]> {
    return Array.from(this.pastes.values()).filter(
      (paste) => paste.isClown
    );
  }

  async updatePaste(id: number, data: Partial<Paste>): Promise<Paste | undefined> {
    const paste = this.pastes.get(id);
    if (!paste) return undefined;

    const updatedPaste = { ...paste, ...data };
    this.pastes.set(id, updatedPaste);
    return updatedPaste;
  }

  async deletePaste(id: number): Promise<boolean> {
    return this.pastes.delete(id);
  }

  // Comment operations
  async getProfileComments(profileUserId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.profileUserId === profileUserId
    );
  }

  async createComment(insertComment: InsertComment & { userId: number }): Promise<Comment> {
    const id = this.commentCurrentId++;
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
}

export const storage = new MemStorage();