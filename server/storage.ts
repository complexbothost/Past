import { users, type User, type InsertUser, pastes, type Paste, type InsertPaste, comments, type Comment, type InsertComment, type AuditLog, type InsertAuditLog, AuditLogAction, type InsertSuggestion, type Suggestion, suggestions } from "@shared/schema";
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
  searchPastesByTitle(query: string): Promise<Paste[]>; // New method for searching pastes

  // Comment operations
  getProfileComments(profileUserId: number): Promise<Comment[]>;
  createComment(comment: InsertComment & { userId: number }): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;

  // Suggestion operations
  createSuggestion(suggestion: InsertSuggestion & { userId: number }): Promise<Suggestion>;
  getSuggestionById(id: number): Promise<Suggestion | undefined>;
  getUserSuggestions(userId: number): Promise<Suggestion[]>;
  getAllSuggestions(): Promise<Suggestion[]>;
  updateSuggestion(id: number, data: Partial<Suggestion>): Promise<Suggestion | undefined>;

  // IP restriction operations
  addRestrictedIP(ip: string, reason: string, restrictedBy: number): Promise<void>;
  removeRestrictedIP(ip: string): Promise<boolean>;
  isIPRestricted(ip: string): Promise<boolean>;
  getAllRestrictedIPs(): Promise<Array<{ ip: string, reason: string, restrictedBy: number, restrictedAt: Date }>>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: number): Promise<AuditLog[]>;
  getAuditLogsByAction(action: string): Promise<AuditLog[]>;
  getDeletedUsers(): Promise<AuditLog[]>;
  getDeletedPastes(): Promise<AuditLog[]>;
  getEditLogs(): Promise<AuditLog[]>;

  // Session storage
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pastes: Map<number, Paste>;
  private comments: Map<number, Comment>;
  private suggestions: Map<number, Suggestion>;
  private restrictedIPs: Map<string, { ip: string, reason: string, restrictedBy: number, restrictedAt: Date }>;
  private auditLogs: Map<number, AuditLog>;
  sessionStore: SessionStore;
  userCurrentId: number;
  pasteCurrentId: number;
  commentCurrentId: number;
  suggestionCurrentId: number;
  auditLogCurrentId: number;

  constructor() {
    this.users = new Map();
    this.pastes = new Map();
    this.comments = new Map();
    this.suggestions = new Map();
    this.restrictedIPs = new Map();
    this.auditLogs = new Map();
    this.userCurrentId = 1;
    this.pasteCurrentId = 1;
    this.commentCurrentId = 1;
    this.suggestionCurrentId = 1;
    this.auditLogCurrentId = 1;
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

    // Create audit log for user creation
    this.createAuditLog({
      action: AuditLogAction.USER_CREATED,
      userId: id,
      targetId: id,
      targetType: "user",
      details: JSON.stringify({ username: user.username }),
      ipAddress: user.ipAddress,
    });

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const oldValues = { ...user };
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);

    // Create audit log for user update
    this.createAuditLog({
      action: AuditLogAction.USER_UPDATED,
      userId: id, // Assuming the user is updating their own profile
      targetId: id,
      targetType: "user",
      details: JSON.stringify({ 
        oldValues,
        newValues: data,
        changes: Object.keys(data)
      }),
      ipAddress: user.ipAddress,
    });

    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    // Store user data before deletion for audit log
    const userData = { ...user };

    // Create audit log for user deletion
    this.createAuditLog({
      action: AuditLogAction.USER_DELETED,
      userId: 1, // Assuming admin is deleting, use 1 as placeholder
      targetId: id,
      targetType: "user",
      details: JSON.stringify(userData),
      ipAddress: null,
    });

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
      isAdminPaste: insertPaste.isAdminPaste || false,
      isPinned: insertPaste.isPinned || null,
      pinnedUntil: insertPaste.pinnedUntil || null,
      extraDetails: insertPaste.extraDetails || null,
      createdAt: new Date() 
    };
    this.pastes.set(id, paste);

    // Create audit log for paste creation
    this.createAuditLog({
      action: AuditLogAction.PASTE_CREATED,
      userId: paste.userId,
      targetId: id,
      targetType: "paste",
      details: JSON.stringify({ 
        title: paste.title,
        isPrivate: paste.isPrivate,
        isAdminPaste: paste.isAdminPaste,
        isPinned: paste.isPinned
      }),
      ipAddress: null,
    });

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

  // New method to search pastes by title
  async searchPastesByTitle(query: string): Promise<Paste[]> {
    // Get all pastes - we'll filter them based on query and visibility
    const allPastes = Array.from(this.pastes.values());

    // If query is empty, return an empty array
    if (!query.trim()) {
      return [];
    }

    // Filter pastes that have a title matching the query (case-insensitive)
    // Only include public pastes in search results
    return allPastes.filter(paste => 
      paste.title.toLowerCase().includes(query.toLowerCase()) && 
      !paste.isPrivate
    );
  }

  async updatePaste(id: number, data: Partial<Paste>): Promise<Paste | undefined> {
    const paste = this.pastes.get(id);
    if (!paste) return undefined;

    const oldValues = { ...paste };
    const updatedPaste = { ...paste, ...data };
    this.pastes.set(id, updatedPaste);

    // Create audit log for paste update
    this.createAuditLog({
      action: AuditLogAction.PASTE_UPDATED,
      userId: paste.userId, // Assuming the paste owner is updating
      targetId: id,
      targetType: "paste",
      details: JSON.stringify({ 
        oldValues,
        newValues: data,
        changes: Object.keys(data)
      }),
      ipAddress: null,
    });

    return updatedPaste;
  }

  async deletePaste(id: number): Promise<boolean> {
    const paste = this.pastes.get(id);
    if (!paste) return false;

    // Store paste data before deletion for audit log
    const pasteData = { ...paste };

    // Create audit log for paste deletion
    this.createAuditLog({
      action: AuditLogAction.PASTE_DELETED,
      userId: paste.userId, // Assuming the paste owner is deleting
      targetId: id,
      targetType: "paste",
      details: JSON.stringify(pasteData),
      ipAddress: null,
    });

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

    // Create audit log for comment creation
    this.createAuditLog({
      action: AuditLogAction.COMMENT_CREATED,
      userId: comment.userId,
      targetId: id,
      targetType: "comment",
      details: JSON.stringify({ 
        profileUserId: comment.profileUserId,
        contentPreview: comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '')
      }),
      ipAddress: null,
    });

    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const comment = this.comments.get(id);
    if (!comment) return false;

    // Store comment data before deletion for audit log
    const commentData = { ...comment };

    // Create audit log for comment deletion
    this.createAuditLog({
      action: AuditLogAction.COMMENT_DELETED,
      userId: 1, // Assuming admin is deleting, use 1 as placeholder
      targetId: id,
      targetType: "comment",
      details: JSON.stringify(commentData),
      ipAddress: null,
    });

    return this.comments.delete(id);
  }

  // Suggestion operations
  async createSuggestion(insertSuggestion: InsertSuggestion & { userId: number }): Promise<Suggestion> {
    const id = this.suggestionCurrentId++;
    const suggestion: Suggestion = {
      ...insertSuggestion,
      id,
      userId: insertSuggestion.userId,
      status: "pending",
      adminResponse: null,
      adminId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.suggestions.set(id, suggestion);

    // Create audit log for suggestion creation
    this.createAuditLog({
      action: AuditLogAction.SUGGESTION_CREATED,
      userId: suggestion.userId,
      targetId: id,
      targetType: "suggestion",
      details: JSON.stringify({ 
        title: suggestion.title,
        contentPreview: suggestion.content.substring(0, 50) + (suggestion.content.length > 50 ? '...' : '')
      }),
      ipAddress: null,
    });

    return suggestion;
  }

  async getSuggestionById(id: number): Promise<Suggestion | undefined> {
    return this.suggestions.get(id);
  }

  async getUserSuggestions(userId: number): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values())
      .filter(suggestion => suggestion.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllSuggestions(): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateSuggestion(id: number, data: Partial<Suggestion>): Promise<Suggestion | undefined> {
    const suggestion = this.suggestions.get(id);
    if (!suggestion) return undefined;

    const oldValues = { ...suggestion };
    const updatedSuggestion = { 
      ...suggestion, 
      ...data,
      updatedAt: new Date() 
    };
    this.suggestions.set(id, updatedSuggestion);

    // Create audit log for suggestion response
    if (data.adminResponse || data.status) {
      this.createAuditLog({
        action: AuditLogAction.SUGGESTION_RESPONDED,
        userId: data.adminId || 1, // Use the admin ID if provided, otherwise default to 1
        targetId: id,
        targetType: "suggestion",
        details: JSON.stringify({ 
          oldValues,
          newValues: data,
          changes: Object.keys(data)
        }),
        ipAddress: null,
      });
    }

    return updatedSuggestion;
  }

  // IP restriction operations
  async addRestrictedIP(ip: string, reason: string, restrictedBy: number): Promise<void> {
    this.restrictedIPs.set(ip, {
      ip,
      reason,
      restrictedBy,
      restrictedAt: new Date()
    });

    // Create audit log for IP restriction
    this.createAuditLog({
      action: AuditLogAction.IP_RESTRICTED,
      userId: restrictedBy,
      targetId: null,
      targetType: "ip",
      details: JSON.stringify({ 
        ip,
        reason
      }),
      ipAddress: null,
    });
  }

  async removeRestrictedIP(ip: string): Promise<boolean> {
    const restrictedIP = this.restrictedIPs.get(ip);
    if (!restrictedIP) return false;

    // Create audit log for IP unrestriction
    this.createAuditLog({
      action: AuditLogAction.IP_UNRESTRICTED,
      userId: 1, // Assuming admin is unrestricting, use 1 as placeholder
      targetId: null,
      targetType: "ip",
      details: JSON.stringify({ 
        ip,
        originalRestriction: restrictedIP
      }),
      ipAddress: null,
    });

    return this.restrictedIPs.delete(ip);
  }

  async isIPRestricted(ip: string): Promise<boolean> {
    return this.restrictedIPs.has(ip);
  }

  async getAllRestrictedIPs(): Promise<Array<{ ip: string, reason: string, restrictedBy: number, restrictedAt: Date }>> {
    return Array.from(this.restrictedIPs.values());
  }

  // Audit log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const id = this.auditLogCurrentId++;
    const auditLog: AuditLog = {
      ...log,
      id,
      createdAt: new Date(),
    };
    this.auditLogs.set(id, auditLog);
    return auditLog;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getAuditLogsByUser(userId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAuditLogsByAction(action: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.action === action)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDeletedUsers(): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.action === AuditLogAction.USER_DELETED)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDeletedPastes(): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.action === AuditLogAction.PASTE_DELETED)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getEditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => 
        log.action === AuditLogAction.USER_UPDATED || 
        log.action === AuditLogAction.PASTE_UPDATED
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();