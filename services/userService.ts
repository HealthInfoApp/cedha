import connection from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { User, CreateUserData } from '@/models/User';

export class UserService {
  async createUser(userData: CreateUserData): Promise<Omit<User, 'password'>> {
    const hashedPassword = await hashPassword(userData.password);
    
    const [result] = await connection.execute(
      `INSERT INTO users (email, password, full_name, user_type, specialization) 
       VALUES (?, ?, ?, ?, ?)`,
      [userData.email, hashedPassword, userData.full_name, userData.user_type, userData.specialization]
    );

    const insertResult = result as any;
    return this.getUserById(insertResult.insertId);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  async getUserById(id: number): Promise<Omit<User, 'password'> | null> {
    const [rows] = await connection.execute(
      'SELECT id, email, full_name, user_type, specialization, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    const users = rows as Omit<User, 'password'>[];
    return users.length > 0 ? users[0] : null;
  }

  async verifyUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await verifyPassword(password, user.password);
    return isValid ? user : null;
  }

  async isEmailTaken(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }
}

export const userService = new UserService();