import connection from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { User, CreateUserData } from '@/models/User';

export class UserService {
  async createUser(userData: CreateUserData): Promise<Omit<User, 'password'>> {
    const hashedPassword = await hashPassword(userData.password);
    const specialization = userData.specialization ?? null;
    const phoneNumber = userData.phone_number ?? null;
    
    const [result] = await connection.execute(
      `INSERT INTO users (email, password, full_name, user_type, specialization, phone_number) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userData.email, 
        hashedPassword, 
        userData.full_name, 
        userData.user_type, 
        specialization, 
        phoneNumber
      ]
    );

    const insertResult = result as any;
    const newUser = await this.getUserById(insertResult.insertId);
    
    if (!newUser) {
      throw new Error('Failed to create user - user not found after insertion');
    }
    
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async getUserById(id: number): Promise<Omit<User, 'password'> | null> {
    try {
      const [rows] = await connection.execute(
        `SELECT id, email, full_name, user_type, specialization, phone_number, 
                profile_image, is_active, created_at, updated_at 
         FROM users WHERE id = ?`,
        [id]
      );

      const users = rows as Omit<User, 'password'>[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
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

  async updateUserProfile(userId: number, updateData: any): Promise<Omit<User, 'password'> | null> {
    const { full_name, phone_number, specialization, profile_image } = updateData;
    
    const updateFields = [];
    const updateValues = [];

    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }
    if (phone_number !== undefined) {
      updateFields.push('phone_number = ?');
      updateValues.push(phone_number);
    }
    if (specialization !== undefined) {
      updateFields.push('specialization = ?');
      updateValues.push(specialization);
    }
    if (profile_image !== undefined) {
      updateFields.push('profile_image = ?');
      updateValues.push(profile_image);
    }

    if (updateFields.length === 0) {
      return this.getUserById(userId);
    }

    updateValues.push(userId);

    try {
      await connection.execute(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );

      return this.getUserById(userId);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }
}

export const userService = new UserService();